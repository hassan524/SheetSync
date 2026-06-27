# SheetSync

A Spreadsheet OpenSource applicaion inspired by GoogleSheet with templates and organiation feature

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

## Features

- Real time collaboration with live presence indicators
- Formula support
- Cell formatting — bold, italic, colors, borders, merges
- Column and row resize and management
- Data validation (Google Sheets-style panel)
- Chart support
- templates
- Export to CSV, PDF, JSON
- Organization and team sharing
- URL based invite system

## Tech Stack

- **Frontend** — Next.js 15, React, TypeScript, Tailwind CSS
- **Spreadsheet** — react-data-grid
- **Backend/DB** — Supabase (PostgreSQL, Realtime, RLS, Auth)
- **Deployment** — Vercel

---

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn (`npm install -g yarn`)
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone the repo

```bash
git clone https://github.com/hassan524/sheetsync.git
cd sheetsync
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Set up environment variables

Create a `.env.local` file in the root and paste the following, filling in your own values:

```env
# ─── EMAIL ────────────────────────────────────────────────
# Get from: resend.com → API Keys
RESEND_API_KEY=

# ─── SUPABASE ─────────────────────────────────────────────
# Get from: Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ─── APP URLS ─────────────────────────────────────────────
# Local dev: http://localhost:3000
NEXT_PUBLIC_APP_URL=
# Production: https://sheetsync.site
NEXT_PUBLIC_PROD_APP_URL=

# ─── FIREBASE (Client) ────────────────────────────────────
# Get from: Firebase Console → Project Settings → General → Your Apps
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# ─── FIREBASE ADMIN (Server-side push notifications) ──────
# Get from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
# Paste the full JSON as a single-line string
FIREBASE_SERVICE_ACCOUNT=

# ─── WEB PUSH (VAPID) ─────────────────────────────────────
# Get from: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
NEXT_PUBLIC_VAPID_KEY=
```

> `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe to expose — they're designed for client-side use and your RLS policies protect the data. Never expose `SUPABASE_SERVICE_ROLE_KEY` anywhere in client code.

### 4. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration files in order from `/db/`
3. Enable **Email Auth** under Authentication → Providers
4. Optionally enable **Google OAuth** and add your credentials
5. Copy your project URL and anon key from **Settings → API** into `.env.local`

### 5. Run the dev server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Contributing

Contributions are welcome! Here's how to get started:

### Branch Naming

| Type     | Pattern                      | Example                 |
| -------- | ---------------------------- | ----------------------- |
| Feature  | `feat/short-description`     | `feat/column-freeze`    |
| Bug fix  | `fix/short-description`      | `fix/merge-cell-scroll` |
| Docs     | `docs/short-description`     | `docs/update-readme`    |
| Refactor | `refactor/short-description` | `refactor/sheet-client` |

### PR Rules

- Always branch off `main` and PR back into `main`
- Keep PRs focused — one feature or fix per PR
- Write a clear title and description explaining what changed and why
- Make sure the app runs locally before submitting
- No direct pushes to `main` — all changes go through PRs

### Commit Style

```
feat: add column freeze support
fix: resolve merge cell overflow on scroll
docs: update env variable instructions
refactor: extract useHistory hook
```

### Code Style

- TypeScript everywhere — avoid `any`
- Tailwind for all styling — no inline styles
- Keep components small and focused
- Add types for all props and function signatures

---

## Security

If you find a security vulnerability, **please do not open a public issue**.

Email **hassanrehan9975@gmail.com** or open a [GitHub Security Advisory](https://github.com/hassan524/sheetsync/security/advisories/new) privately.

SheetSync uses Supabase RLS to ensure users can only access their own data and sheets they've been explicitly granted access to. RLS bypasses are treated as high-priority reports.

---

## License

[MIT](LICENSE) © Hassan
