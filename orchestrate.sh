#!/usr/bin/env bash
# ==============================================================================
# orchestrate.sh — Claude Code + Codex automated test pipeline
#
# Usage:
#   ./orchestrate.sh <step-dir>
#
# Example:
#   ./orchestrate.sh phase5/step1
#
# Prerequisites:
#   - Claude Code CLI authenticated (claude login status)
#   - Codex CLI authenticated  (codex login status)
#   - pnpm installed
#
# Flow:
#   1. Claude writes fix code + TEST-SPEC.md  (already done before this script)
#   2. This script sends TEST-SPEC.md to Codex → writes tests + runs them
#   3. Codex outputs TEST-REPORT.md
#   4. If failures found, Claude reads report and fixes → loop back to step 2
#   5. All green → notify user for review
# ==============================================================================
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
STEP_DIR="${1:?Usage: ./orchestrate.sh <step-dir>}"
SPEC_FILE="${PROJECT_ROOT}/${STEP_DIR}/TEST-SPEC.md"
REPORT_FILE="${PROJECT_ROOT}/${STEP_DIR}/TEST-REPORT.md"
MAX_ROUNDS=3
CODEX_TIMEOUT=300  # seconds

# Codex model fallback chain (best → fallback)
CODEX_MODELS=("gpt-5.4" "gpt-5.2-codex" "gpt-5.1-codex-max" "gpt-5")

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ── Pre-flight checks ────────────────────────────────────────────────────────
preflight() {
  log_info "Running pre-flight checks..."

  if ! command -v codex &>/dev/null; then
    log_error "Codex CLI not found. Install: npm i -g @openai/codex"
    exit 1
  fi

  if ! command -v claude &>/dev/null; then
    log_error "Claude Code CLI not found."
    exit 1
  fi

  if [[ ! -f "$SPEC_FILE" ]]; then
    log_error "TEST-SPEC.md not found at: $SPEC_FILE"
    log_error "Claude must create TEST-SPEC.md before running this script."
    exit 1
  fi

  log_ok "Pre-flight passed"
}

# ── Codex model fallback runner ───────────────────────────────────────────────
# Tries each model in CODEX_MODELS. On quota/rate-limit error, falls back.
# Outputs the model that succeeded to stdout.
run_codex() {
  local prompt="$1"
  local used_model=""

  for model in "${CODEX_MODELS[@]}"; do
    log_info "Trying Codex model: ${model}..."

    local output
    local exit_code=0

    # gpt-5 does not support xhigh reasoning effort
    local extra_flags=""
    if [[ "$model" == "gpt-5" ]]; then
      extra_flags='-c model_reasoning_effort="medium"'
    fi

    output=$(eval timeout "$CODEX_TIMEOUT" codex exec \
      -m "$model" $extra_flags \
      --full-auto \
      -q \
      '"$prompt"' 2>&1) || exit_code=$?

    # Check for quota / rate-limit errors
    if echo "$output" | grep -qiE "rate.limit|quota|too many requests|capacity|exceeded|429"; then
      log_warn "${model} quota exhausted. Falling back..."
      continue
    fi

    # Check for unsupported model error
    if echo "$output" | grep -qi "not supported"; then
      log_warn "${model} not supported. Falling back..."
      continue
    fi

    # Check for timeout
    if [[ $exit_code -eq 124 ]]; then
      log_warn "${model} timed out after ${CODEX_TIMEOUT}s. Falling back..."
      continue
    fi

    # Success
    used_model="$model"
    log_ok "Codex completed with model: ${used_model}"
    echo "$output"
    echo ""
    echo "---CODEX_MODEL_USED:${used_model}---"
    return 0
  done

  log_error "All Codex models exhausted. Cannot run tests."
  return 1
}

# ── Phase: Codex writes and runs tests ────────────────────────────────────────
run_codex_tests() {
  local spec_content
  spec_content=$(cat "$SPEC_FILE")

  local codex_prompt
  codex_prompt="You are a test engineer. Read the TEST-SPEC.md below and:
1. Write test files according to the spec (using Vitest, following existing test patterns)
2. Run 'pnpm test' to execute all tests
3. Write a TEST-REPORT.md at '${REPORT_FILE}' with:
   - Which model you used (will be injected by the caller)
   - Total tests run / passed / failed
   - For each failure: test name, expected vs actual, file:line
   - Verdict: ALL_PASS or HAS_FAILURES

TEST-SPEC.md contents:
---
${spec_content}
---

Project root: ${PROJECT_ROOT}
Write test files in the locations specified by TEST-SPEC.md.
After writing tests, run: cd ${PROJECT_ROOT} && pnpm test
Then write TEST-REPORT.md with results."

  local codex_output
  codex_output=$(run_codex "$codex_prompt") || return 1

  # Extract which model was used
  local model_used
  model_used=$(echo "$codex_output" | grep "CODEX_MODEL_USED" | sed 's/.*CODEX_MODEL_USED:\(.*\)---.*/\1/')

  if [[ -n "$model_used" ]]; then
    log_info "=========================================="
    log_info "  Tests completed by model: ${model_used}"
    log_info "=========================================="

    # Inject model info into report if it exists
    if [[ -f "$REPORT_FILE" ]]; then
      sed -i '' "1s/^/# Test Report (model: ${model_used})\n\n/" "$REPORT_FILE" 2>/dev/null || true
    fi
  fi

  return 0
}

# ── Phase: Check test results ─────────────────────────────────────────────────
check_results() {
  if [[ ! -f "$REPORT_FILE" ]]; then
    log_error "TEST-REPORT.md not found. Codex may have failed silently."
    return 1
  fi

  if grep -qi "ALL_PASS" "$REPORT_FILE"; then
    return 0
  else
    return 1
  fi
}

# ── Phase: Claude fixes failures ──────────────────────────────────────────────
claude_fix() {
  local report_content
  report_content=$(cat "$REPORT_FILE")

  log_info "Sending failure report to Claude for fixes..."

  claude -p "You are fixing test failures found by an independent test engineer.

TEST-REPORT.md:
---
${report_content}
---

Instructions:
1. Read each failure carefully
2. Fix the SOURCE CODE (not the tests) to make them pass
3. Do NOT modify test files — they are the contract
4. After fixing, run: cd ${PROJECT_ROOT} && pnpm test
5. If all tests pass, respond with: FIXES_APPLIED
6. If tests still fail, explain what remains broken

Project root: ${PROJECT_ROOT}" 2>&1 | tee "${PROJECT_ROOT}/${STEP_DIR}/claude-fix-log.txt"
}

# ── Main loop ─────────────────────────────────────────────────────────────────
main() {
  preflight

  log_info "Starting test pipeline for: ${STEP_DIR}"
  log_info "Max rounds: ${MAX_ROUNDS}"

  for round in $(seq 1 "$MAX_ROUNDS"); do
    echo ""
    log_info "══════════════════════════════════════"
    log_info "  Round ${round}/${MAX_ROUNDS}"
    log_info "══════════════════════════════════════"

    # Step 1: Codex writes tests + runs them
    log_info "Phase: Codex writing and running tests..."
    if ! run_codex_tests; then
      log_error "Codex test phase failed. Aborting."
      exit 1
    fi

    # Step 2: Check results
    if check_results; then
      echo ""
      log_ok "══════════════════════════════════════"
      log_ok "  ALL TESTS PASSED (round ${round})"
      log_ok "══════════════════════════════════════"
      log_info "Ready for review. Run:"
      log_info "  1. pnpm test                  (verify locally)"
      log_info "  2. git add && git commit      (stage changes)"
      log_info "  3. Create PR for review"
      exit 0
    fi

    log_warn "Test failures detected in round ${round}."

    if [[ $round -eq $MAX_ROUNDS ]]; then
      log_error "Max rounds reached. Manual intervention required."
      log_error "See: ${REPORT_FILE}"
      exit 1
    fi

    # Step 3: Claude fixes failures
    claude_fix

    # Remove old report for next round
    rm -f "$REPORT_FILE"
  done
}

main "$@"
