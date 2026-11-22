# Interglott Admin Console

Administration and operations console built with Next.js 16 App Router, React 19, TypeScript, PostgreSQL, Prisma 7, NextAuth.js, and shadcn/ui.

## Features

- **Unified Operations Overview (`/admin`):** Interactive KPI metric cards and instant tab switching across **Intake Surveys**, **Contact Desk**, **Bookings & Calls**, **Placement Diagnostics**, **Admin Users**, and **Payments Feed**, with CSV export and email dispatch logs.
- **Debounced Live Search, Instant Filters & Database Sorting:** Every table supports 300ms debounced search, instant status/language/track filters, and server-side sorting (`Newest`, `Oldest`, `Name A–Z`, `Amount`) without manual submit buttons.
- **Structured Record Inspector & Safe Deletions:** Slide-over detail drawer (`AdminRecordDrawer`) formats record fields cleanly, paired with compact icon-only row actions and `AlertDialog` confirmation for database deletions.
- **Intake Leads & Tutor Bookings (`/admin/leads`, `/admin/tutor-bookings`):** Inline status progression (`new` → `in_review` → `matched` → `contacted` → `converted` and booking confirmations), internal admin notes, and tutor assignment.
- **Payments Ledger (`/admin/payments`):** Single and bulk payment approval/rejection workflow with automatic subscription status updates (`basic_premium`, `pro`, `sapphire`).
- **Administrator Access Control (`/admin/users`):** Grant or revoke `admin` roles, create new administrator accounts with Argon2 password hashing, and prevent self-demotion of the active session.
- **Responsive Collapsible Shell:** Built on shadcn (`collapsible="icon"`, `variant="inset"`) with breadcrumb navigation and user menu.

## Tech Stack

- **Framework:** Next.js `16.4.6` (App Router, Server Components, Server Actions)
- **UI & Styling:** React `19.3`, TypeScript `5.8`, Tailwind CSS `3.4`, shadcn/ui (Radix UI), Lucide Icons, Sonner
- **Database & ORM:** PostgreSQL + Prisma `7.10` (`@prisma/adapter-pg`)
- **Authentication:** NextAuth.js v4 (`CredentialsProvider` + `argon2`, restricted to users with `role = 'admin'` in `user_roles`)
- **Testing & Quality:** Vitest, React Testing Library, JSDOM, ESLint 9

## Project Structure

```text
├── prisma/
│   ├── schema.prisma               # PostgreSQL database schema
│   └── migrations/                 # SQL migrations
├── public/                         # Brand logos and static assets
└── src/
    ├── app/
    │   ├── actions/
    │   │   ├── admin.ts            # Admin-guarded Server Actions (update, approve, create/revoke admin, delete)
    │   │   └── adminNotifications.ts
    │   ├── admin/
    │   │   ├── leads/              # Intake leads management (/admin/leads)
    │   │   ├── learners/           # Registered learners directory (/admin/learners)
    │   │   ├── login/              # Admin sign-in (/admin/login)
    │   │   ├── payments/           # Payment review & approval ledger (/admin/payments)
    │   │   ├── tutor-bookings/     # Tutor booking requests (/admin/tutor-bookings)
    │   │   ├── users/              # Administrator access management (/admin/users)
    │   │   └── page.tsx            # Operations overview (/admin)
    │   ├── api/
    │   │   ├── admin-notifications/# Email alert log feed endpoint
    │   │   └── auth/[...nextauth]/ # NextAuth route handler
    │   └── page.tsx                # Root redirect (/ -> /admin or /admin/login)
    ├── components/
    │   ├── admin/                  # Sidebar-07 shell, record drawer, row actions, search input, delete dialog
    │   └── ui/                     # shadcn/ui primitives
    ├── hooks/
    │   └── useAdminTableQuery.ts   # Debounced search & instant URL filter/sort hook
    ├── lib/
    │   ├── adminPageData.server.ts # Server-side paginated Prisma data loaders
    │   ├── authOptions.ts          # NextAuth configuration
    │   ├── prisma.ts               # Prisma PostgreSQL adapter singleton
    │   ├── publicAppUrl.ts         # External public platform URL helper
    │   └── serverAuth.ts           # Admin session guard
    └── test/                       # Vitest setup and mocks
```

## Routes

| Route | Description |
| --- | --- |
| `/` | Redirects authenticated admins to `/admin`, otherwise to `/admin/login` |
| `/admin/login` | Administrator email & password sign-in |
| `/admin` | Operations overview across all 6 data feeds + email alert log modal + CSV export |
| `/admin/leads` | KYC intake survey leads with status, track, and notes management |
| `/admin/learners` | Registered non-admin learners directory with language filtering |
| `/admin/tutor-bookings` | 1-on-1 tutor booking requests (`/admin/bookings` redirects here) |
| `/admin/payments` | Pending, approved, and rejected subscription payments ledger |
| `/admin/users` | Administrator accounts, role promotion, and revocation |

## Getting Started

### Prerequisites

- **Node.js** 20.9+ (Node 22 LTS recommended)
- **npm** 10+
- **PostgreSQL** database

### Installation

```bash
# 1. Install dependencies (automatically runs `prisma generate`)
npm install

# 2. Copy the example environment file and configure credentials
cp .env.example .env

# 3. Start the development server on http://localhost:3000
npm run dev
```

### Environment Variables

Configure the following in `.env`:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_URL` | Optional | Direct PostgreSQL connection string for Prisma CLI |
| `NEXTAUTH_SECRET` | Yes | Secret used to sign NextAuth JWT sessions (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | Canonical URL of the application (`http://localhost:3000` locally) |
| `NEXT_PUBLIC_PUBLIC_APP_URL` | Optional | External public learner platform URL |
| `ADMIN_NOTIFICATION_EMAIL` | Optional | Default admin recipient for test/dispatch notifications |
| `RESEND_API_KEY` | Optional | Resend API key for transactional email alerts |
| `RESEND_FROM_EMAIL` | Optional | Verified sender address in Resend |

## Bootstrapping the First Administrator

Administrator access requires a row in `user_roles` with `role = 'admin'`. Once signed in, an existing admin can create or promote additional admins at `/admin/users`. On a fresh database, promote an existing user directly in PostgreSQL:

```sql
INSERT INTO user_roles (id, user_id, role, created_at)
SELECT gen_random_uuid(), id, 'admin', now()
FROM users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server on port `3000` |
| `npm run build` | Build the production Next.js application |
| `npm run start` | Serve the production build on port `3000` |
| `npm run lint` | Run ESLint across the codebase |
| `npm test` | Run the Vitest unit and component test suite |
| `npm run test:watch` | Run Vitest in interactive watch mode |
| `npm run db:generate` | Regenerate the Prisma client in `src/generated/prisma` |
| `npm run db:migrate` | Run Prisma migrations in development |
