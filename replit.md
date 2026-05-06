# SheetSync

A cloud spreadsheet platform with real-time collaboration, 100+ formulas, templates, team organizations, and full import/export — all in one workspace.

## Run & Operate

- `yarn dev` — start the Next.js dev server (port 3000)
- `yarn build` — production build
- `yarn start` — run production build
- Required env secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, Firebase vars, `SESSION_SECRET`, `RESEND_API_KEY`

## Stack

- Next.js 15 (App Router, Server Actions)
- TypeScript 5
- Supabase (auth + database)
- Tailwind CSS v4 + shadcn/ui
- AG Grid + hot-formula-parser (sheet engine)
- Yarn (package manager)

## Where things live

- `src/app/` — Next.js App Router pages and layouts
- `src/components/` — React components (UI, sheet editor, navigation)
- `src/context/AuthContext.tsx` — Supabase auth context
- `src/lib/supabase/` — Supabase client (browser + server)
- `src/hooks/sheets/` — formula engine and sheet hooks
- `src/data/` — static data (FAQs, templates, etc.)
- `middleware.ts` — route protection (redirect unauthenticated users to `/`)
- `next.config.ts` — Next.js config with Replit-compatible settings

## Architecture decisions

- **compress: true** in next.config.ts — required to gzip JS chunks (~2.7MB → ~627KB) so they load through the Replit proxy without timing out
- **Supabase SSR** via `@supabase/ssr` for cookie-based auth on server and client
- **Middleware** protects all routes except `/` — redirects logged-out users to landing page
- **NEXT_PUBLIC_*** env vars are Replit secrets, injected at runtime in dev mode
- **allowedDevOrigins** includes `*.pike.replit.dev` for HMR to work through the Replit proxy

## Product

Landing page + authenticated spreadsheet app. Users sign in with Google OAuth via Supabase. Features: real-time collaboration, formula engine (100+ functions), templates, organizations/teams, Excel/CSV import-export, activity history.

## User preferences

- Do not change source code without explicit permission
- Original project is a Next.js + TypeScript app (not converted to Vite)
- Uses Yarn (not npm or pnpm) for package management
- Run with `yarn dev`, not `pnpm` or `npm`

## Gotchas

- `yarn install --ignore-scripts` required (husky git hooks are blocked in Replit)
- Chunks are large (2.7MB+); `compress: true` in next.config.ts is critical for the Replit proxy
- Port 3000 can be occupied by lingering processes — run `fuser -k 3000/tcp` before restarting
- `NEXT_PUBLIC_*` vars must be set as Replit secrets for both server and client to work

## Pointers

- Supabase dashboard: https://supabase.com/dashboard/project/_/settings/api
