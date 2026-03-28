# Food Delivery Application

Full-stack food delivery platform built with Next.js 16 App Router, React 19, Hono, PostgreSQL (Neon), Drizzle ORM, and NextAuth.js v5. The customer experience and admin dashboard now live in the same web app, with admin routes served from `/admin`.

## Current Status

- Foundation and modernization work are complete.
- Engineering quality work is in progress.
- Several product-completion features are already shipped in the repository.

## Architecture

### Web App (`apps/web`)
- Next.js 16 App Router
- React 19
- TanStack Query v5
- Zustand 5
- Tailwind CSS v4 + shadcn/ui
- NextAuth.js v5
- Sentry + Vercel Analytics + Speed Insights

### Backend (`backend`)
- Hono + TypeScript
- PostgreSQL (Neon) + Drizzle ORM
- Stripe payments + webhook verification
- AWS S3 presigned uploads
- Upstash Redis rate limiting
- Sentry server-side error tracking

### Shared Package (`packages/shared`)
- Shared Zod schemas
- Shared TypeScript contracts for frontend and backend

## Key Features

### Customer Experience
- Browse, search, sort, and paginate food listings
- Persistent cart with backend sync
- Register and sign in with NextAuth.js
- Stripe checkout, payment retry, and order tracking
- Profile and address management
- Promo-code validation
- Privacy Policy and Terms pages

### Admin Experience
- Food CRUD with S3 image upload
- Order management and status updates
- Dashboard charts and operational summary
- Stripe KYC verification flow

### Quality and Operations
- Shared schema contracts across the stack
- Vitest + React Testing Library + MSW
- Playwright smoke / auth / navigation coverage
- GitHub Actions CI
- Dependabot dependency updates

## Project Structure

```text
FoodDelivery-AWS-Vercell/
├── apps/
│   └── web/                 Next.js web app + /admin routes
├── backend/                 Hono API server
├── packages/
│   └── shared/              Shared schemas and types
├── docs/                    Project notes and roadmap
└── .github/workflows/       CI automation
```

## Prerequisites

- Node.js >= 20.9.0
- pnpm >= 8.0.0
- PostgreSQL / Neon database
- Stripe account
- AWS S3 bucket
- Upstash Redis instance

## Installation

```bash
pnpm install
```

## Development

```bash
# Start the backend API
pnpm dev:backend

# Start the web app (customer + admin routes)
pnpm dev:web
```

With the web app running locally, the admin dashboard is available at `/admin`.

## Quality Checks

```bash
pnpm typecheck
pnpm lint:web
pnpm test:coverage
pnpm build
```

## Environment Variables

See the package-level example files for required variables:

- `apps/web/env.local.example`
- `backend/.env.example` (if present in your local setup)

## Deployment

- `apps/web` is deployed as the Next.js serverless frontend on Vercel.
- `backend` is deployed as the API service on Vercel.
- Admin functionality is served through the web app instead of a separate admin project.

## Known Cleanup Areas

- Legacy standalone admin build output remains under `admin/dist`.
- Legacy MongoDB migration helpers remain under `backend/` for historical migration work.
- The repository roadmap should be treated as an implementation snapshot, not a guarantee that every remaining feature is unfinished.

## License

This project is licensed under the MIT License.
