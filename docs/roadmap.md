# Delivery Roadmap

## Snapshot

| Phase | Focus | Version Target | Status |
|------|------|------|------|
| 1 | Foundation rebuild | v0.1.0 | Completed |
| 2 | Modernization | v0.2.0 | Completed |
| 3 | Engineering quality | v0.3.0 | Completed |
| 4 | Product completion | v0.4.0 | Completed |
| 5 | Bug fixes + test quality rebuild | v0.5.0 | Completed |
| 6 | Product polish + engineering cleanup | v0.6.0 | Completed |

## Phase 1: Foundation Rebuild

Completed outcomes:

- pnpm workspace monorepo
- Shared Zod contracts
- RBAC and cookie-based auth hardening
- Stripe webhook verification
- Request validation
- API rate limiting
- Environment validation

## Phase 2: Modernization

Completed outcomes:

- Next.js App Router frontend
- Hono backend migration
- PostgreSQL / Neon + Drizzle ORM migration
- Shared admin experience inside `apps/web`
- S3 presigned upload workflow

## Phase 3: Engineering Quality

Already landed in the repository:

- Vitest coverage uplift and thresholds
- Playwright smoke / auth / navigation coverage
- Sentry instrumentation on frontend and backend
- Vercel Analytics + Speed Insights
- Dependabot automation

Resolved in later phases:

- Backend automated tests (Phase 5: 70 tests)
- E2E checkout and order-lifecycle coverage (Phase 5: 101 Playwright tests)
- Observability cleanup — Sentry sample rate tuning (Phase 6)
- No stale scripts found — all scripts actively used

## Phase 4: Product Completion

Already landed in the repository:

- Promo validation
- Profile and address management
- Order cancel / retry-payment flows
- Admin dashboard
- Privacy Policy and Terms pages
- Stripe KYC admin flow

Resolved in later phases:

- Search and pagination hardening (Phase 5: compound cursor pagination)
- Production verification (Phase 5: full deployment verification)
- Realtime order-status updates: deferred (Vercel Serverless does not support SSE/WebSocket long connections; 10s polling is sufficient for delivery status updates)

## Phase 5: Bug Fixes + Test Quality Rebuild

Addressing 33 issues found during Phase 4 code review. Introduces Claude + Codex
separation of concerns: Claude writes code and test specs, Codex writes and runs tests.

Steps:

- Step 0: Infrastructure hardening (deploy cleanup, CI hardening, backend test framework, orchestrate.sh)
- Step 1: Order cancel safety (race condition, Stripe refund, atomic operations)
- Step 2: Pagination and list query fixes (cursor encoding, secondary sort, timeout leak)
- Step 3: KYC status machine + audit logging (downgrade protection, audit trail)
- Step 4: Promo and payment integrity (minOrder, re-validation, idempotency)
- Step 5: Address and user data safety (default address race, deletion guard)
- Step 6: Frontend robustness (missing statuses, UTC dates, empty states)
- Step 7: Performance and cleanup (indexes, caching, stale debug endpoints)

## Phase 6: Product Polish + Engineering Cleanup

Completed outcomes:

- Cart atomic updates via PostgreSQL jsonb_set (race condition fix)
- Food price validation (finite, positive)
- Live database health check (SELECT 1 instead of static string)
- Sentry trace sampling tuned to 10% in production (client, server, edge)
- Explicit sentry.client.config.ts
- CI E2E conditionally enabled with backend server startup
- Polling indicator removed from My Orders (silent background refresh)
- Database driver switched from neon-http to neon-serverless (transaction support)

## Working Rule

From this point on, roadmap status should be updated when code lands. The repository already contains work beyond the original Phase 2 scope, so roadmap drift should be treated as maintenance debt.
