# Food Delivery Application

A full-stack food delivery platform built with Next.js 15, Express.js, and MongoDB. Features modern authentication (NextAuth.js v5), Stripe payments, and a separate admin panel. Deployed on Vercel.

## Live Demo

- **Customer App**: [food-delivery-web-eosin.vercel.app](https://food-delivery-web-eosin.vercel.app)
- **Admin Panel**: [admin-kappa-ivory.vercel.app](https://admin-kappa-ivory.vercel.app)
- **Backend API**: [backend-ten-azure-58.vercel.app](https://backend-ten-azure-58.vercel.app)

## Tech Stack

### Customer App (`apps/web`)
- **Framework**: Next.js 15 (App Router, SSG + ISR)
- **Language**: TypeScript 5
- **Authentication**: NextAuth.js v5 (httpOnly cookies, JWT strategy)
- **Data Fetching**: TanStack Query v5
- **State Management**: Zustand 5 (cart)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Form Validation**: Zod (shared schemas)
- **Image Optimization**: Next.js Image
- **Testing**: Vitest + React Testing Library

### Backend (`backend`)
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript 5
- **Database**: MongoDB Atlas with Mongoose
- **Authentication**: JWT + bcrypt + RBAC
- **File Storage**: AWS S3
- **Payment**: Stripe (Webhook verification)
- **Validation**: Zod (shared schemas)
- **Rate Limiting**: Upstash Redis

### Admin Panel (`admin`)
- **Framework**: React 18 with Vite
- **Styling**: CSS3
- **Deployment**: Vercel

### Shared Package (`packages/shared`)
- Zod schemas for API contracts (User, Food, Order, Cart)
- TypeScript type inference from schemas

## Project Structure

```text
FoodDelivery-AWS-Vercell/
├── apps/
│   └── web/               Next.js 15 customer app
│       ├── src/app/        App Router (layouts + pages + API routes)
│       ├── src/auth.ts     NextAuth.js v5 config
│       ├── src/proxy.ts    Route protection middleware
│       └── src/components/ UI components (shadcn/ui)
├── backend/               Express.js API server
│   ├── controllers/       Business logic
│   ├── middleware/         Auth + RBAC + rate limiting
│   ├── models/            Mongoose schemas
│   └── api/index.js       Vercel serverless adapter
├── admin/                 Admin panel (React + Vite)
├── packages/shared/       Zod schemas + TypeScript types
└── CLAUDE.md              Development instructions
```

## Key Features

### Customer App
- Browse food items by category with search
- Shopping cart with backend sync
- User authentication (register / login)
- Checkout with Stripe payment
- Order history with status tracking
- Dark mode support
- Responsive design (mobile / tablet / desktop)

### Admin Panel
- Add / edit / delete food items with image upload (AWS S3)
- View and manage all orders
- Update order status
- RBAC-protected endpoints

### Security
- httpOnly cookie authentication (no localStorage JWT)
- RBAC middleware for admin routes
- Stripe Webhook signature verification
- Zod input validation on all endpoints
- API rate limiting (Upstash Redis)

## Getting Started

### Prerequisites
- Node.js >= 20.9.0
- pnpm >= 8.0.0
- MongoDB Atlas account
- AWS S3 bucket
- Stripe account

### Installation

```bash
pnpm install
```

### Development

```bash
# Start backend
pnpm dev:backend

# Start customer app
pnpm dev:web

# Start admin panel
pnpm dev:admin
```

### Testing

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report
```

### Environment Variables

See `.env.example` files in each package for required variables.

## Deployment

All services are deployed on Vercel:
- **Customer App** (`apps/web`): Next.js serverless
- **Backend** (`backend`): Serverless functions
- **Admin** (`admin`): Static site
- **Database**: MongoDB Atlas
- **Storage**: AWS S3
- **Payments**: Stripe

## CI/CD

GitHub Actions runs on every PR:
1. TypeScript type check
2. ESLint
3. Vitest tests
4. Build verification

Branch protection requires all checks to pass before merging.

## License

This project is licensed under the MIT License.
