# Tomato — Food Delivery Platform

Full-stack food delivery platform with customer ordering, Stripe payments, admin dashboard, and comprehensive test coverage. Built with Next.js 15, Hono, PostgreSQL (Neon), and deployed on Vercel.

**Live Demo:** [food-delivery-web-eosin.vercel.app](https://food-delivery-web-eosin.vercel.app)

## Highlights

- **544 automated tests** — 373 frontend unit + 70 backend unit + 101 E2E (Playwright)
- **Stripe checkout** with server-side price verification, webhook confirmation, and promo code support
- **Admin dashboard** with food CRUD, order management, revenue charts, and KYC verification
- **Security hardened** — JWT auth, RBAC, userId ownership checks, atomic DB operations, rate limiting
- **AI-assisted development** — Claude Code + Codex Plugin with automated review gates

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Next.js 15  │────▶│    Hono     │────▶│   Neon DB   │
│  (Frontend)  │     │  (Backend)  │     │ (PostgreSQL) │
└──────┬───────┘     └──────┬───────┘     └─────────────┘
       │                    │
       │              ┌─────┴──────┐
       │              │   Stripe   │
       │              │ (Payments) │
       │              └────────────┘
       │
  ┌────┴─────┐
  │  AWS S3  │
  │ (Images) │
  └──────────┘
```

### Frontend (`apps/web`)

| Technology | Purpose |
|---|---|
| Next.js 15 App Router | Server-side rendering + routing |
| React 19 | UI components |
| TanStack Query v5 | Data fetching + caching |
| Zustand 5 | Client-side state (cart) |
| Tailwind CSS v4 + shadcn/ui | Styling |
| NextAuth.js v5 | Authentication (httpOnly cookies + RBAC) |
| Sentry | Error tracking |

### Backend (`backend`)

| Technology | Purpose |
|---|---|
| Hono | Lightweight web framework |
| Drizzle ORM | Type-safe database queries |
| PostgreSQL (Neon) | Database (serverless WebSocket driver) |
| Stripe | Payment processing + webhooks |
| AWS S3 | Image storage (presigned uploads) |

### Shared (`packages/shared`)

- Zod schemas shared between frontend and backend
- TypeScript type contracts

## Features

### Customer Experience
- Browse, search, sort, and paginate food listings (cursor-based pagination)
- Persistent cart with optimistic updates and backend sync
- Stripe checkout with promo code validation
- Order tracking with background polling
- Profile and address management (Google Maps autocomplete)
- Payment retry and order cancellation with Stripe refund

### Admin Dashboard (`/admin`)
- Revenue, orders, users, and menu item statistics
- Food CRUD with S3 presigned image upload
- Order status management
- Stripe Identity KYC verification with state machine

### Security
- Server-side price verification (never trust client prices)
- userId ownership checks on all order operations
- Read-only `/verify` endpoint (no destructive GET requests)
- Atomic cart updates via PostgreSQL `jsonb_set`
- Database transactions for multi-step operations
- Rate limiting on auth and order endpoints

## Project Structure

```
FoodDelivery-AWS-Vercell/
├── apps/
│   └── web/                    Next.js frontend + admin routes
│       ├── src/
│       │   ├── app/(main)/     Customer pages
│       │   ├── app/(admin)/    Admin pages
│       │   └── components/     Shared components
│       └── e2e/                Playwright E2E tests (101 tests)
├── backend/
│   ├── controllers/            Business logic
│   ├── db/                     Drizzle schema + connection
│   ├── middleware/              Auth + rate limiting
│   ├── routes/                 API route definitions
│   └── __tests__/              Backend unit tests (70 tests)
├── packages/
│   └── shared/                 Shared Zod schemas
├── docs/
│   ├── roadmap.md              Development roadmap
│   └── dev-notes/              Phase retrospectives (39 entries)
└── .github/workflows/          CI automation
```

## Getting Started

### Prerequisites
- Node.js >= 20
- pnpm >= 10
- PostgreSQL database ([Neon](https://neon.tech) recommended)
- Stripe account
- AWS S3 bucket

### Installation
```bash
git clone https://github.com/TiM1113/FoodDelivery-AWS-Vercell.git
cd FoodDelivery-AWS-Vercell
pnpm install
```

### Environment Variables

Create `.env` files from examples:
- `apps/web/.env.local` — NextAuth secret, backend URL, Stripe keys, Google Maps key
- `backend/.env` — Database URL, Stripe secret + webhook secret, AWS credentials, JWT secret

### Development
```bash
# Terminal 1: Start backend
pnpm dev:backend

# Terminal 2: Start frontend
pnpm dev:web
```

Frontend: http://localhost:3000 | Admin: http://localhost:3000/admin

### Testing
```bash
# Unit tests
pnpm test                           # Frontend (373 tests)
pnpm --filter backend test          # Backend (70 tests)

# E2E tests (requires backend running)
pnpm --filter @food-delivery/web test:e2e   # Playwright (101 tests)

# Quality checks
pnpm typecheck                      # TypeScript
pnpm lint:web                       # ESLint
pnpm build                          # Full build
```

## Development Phases

| Phase | Focus | Version |
|---|---|---|
| 1 | Foundation (monorepo, RBAC, Stripe, rate limiting) | v0.1.0 |
| 2 | Modernization (Next.js, Hono, PostgreSQL, S3) | v0.2.0 |
| 3 | Engineering quality (testing, Sentry, CI) | v0.3.0 |
| 4 | Product completion (promo, addresses, admin, KYC) | v0.4.0 |
| 5 | Bug fixes + test rebuild (33 bugs fixed, 521 tests) | v0.5.0 |
| 6 | Polish + cleanup (security fixes, Sentry tuning, CI E2E) | v0.6.0 |

See [docs/roadmap.md](docs/roadmap.md) for detailed outcomes per phase.

## CI/CD

Every PR triggers:
- TypeScript type check
- ESLint
- Backend + frontend unit tests
- Build check
- CodeRabbit AI review
- Snyk security scan
- Vercel preview deployment

E2E tests run conditionally when `E2E_ENABLED` is set.

## Deployment

Both `apps/web` and `backend` deploy as Vercel Serverless functions. Merging to `main` triggers automatic production deployment.

- Frontend: [food-delivery-web-eosin.vercel.app](https://food-delivery-web-eosin.vercel.app)
- Backend API: [backend-ten-azure-58.vercel.app](https://backend-ten-azure-58.vercel.app)

## License

MIT
