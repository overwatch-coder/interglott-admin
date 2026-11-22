# Interglott Admin Console

Standalone Next.js App Router administration application for Interglott, sharing the same PostgreSQL database and Prisma schema as `interglott-nextjs`.

## Routes

- `/` — redirects authenticated admins to `/admin`, otherwise to `/admin/login`
- `/admin/login` — admin credentials sign-in
- `/admin` — operations overview (intake surveys, contact desk, bookings & calls, diagnostics, payments feed)
- `/admin/leads` — intake leads management
- `/admin/learners` — registered learners directory
- `/admin/tutor-bookings` — tutor booking requests (legacy `/admin/bookings` redirects here)
- `/admin/payments` — payment review and approval ledger
- `/admin/users` — administrator access management

## Local setup

Use Node.js and npm.

1. Copy `.env.example` to `.env` and configure `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` (plus `NEXT_PUBLIC_PUBLIC_APP_URL`, `ADMIN_NOTIFICATION_EMAIL`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` as needed).
2. Install dependencies: `npm install` (runs `prisma generate` automatically).
3. Start development server: `npm run dev`.

## Scripts

- `npm run dev` — start Next.js in development
- `npm run build` — create a production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint
- `npm test` — run Vitest suite
- `npm run db:generate` — generate the Prisma client
- `npm run db:migrate` — run Prisma migrations
