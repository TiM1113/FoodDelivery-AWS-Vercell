#!/bin/bash
set -e

# 1. Bundle entry-vercel.ts into a single JS file
npx esbuild entry-vercel.ts \
  --bundle \
  --platform=node \
  --target=node22 \
  --format=esm \
  --outfile=.vercel/output/functions/api/index.func/index.js \
  --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);"

# 2. Function runtime config
cat > .vercel/output/functions/api/index.func/.vc-config.json << 'VCEOF'
{
  "runtime": "nodejs22.x",
  "handler": "index.js",
  "launcherType": "Nodejs",
  "maxDuration": 30,
  "supportsResponseStreaming": true
}
VCEOF

# 3. Function package.json (ESM)
cat > .vercel/output/functions/api/index.func/package.json << 'PKGEOF'
{ "type": "module" }
PKGEOF

# 4. Routing config — all requests → the function
cat > .vercel/output/config.json << 'CFGEOF'
{
  "version": 3,
  "routes": [
    { "src": "/(.*)", "dest": "/api/index" }
  ]
}
CFGEOF

# 5. Empty static directory (required by Build Output API)
mkdir -p .vercel/output/static

echo "Build Output API structure created successfully"
