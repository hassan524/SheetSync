# SheetSync

A cloud spreadsheet platform with real-time collaboration, 100+ formulas, templates, team organizations, and full import/export — all in one workspace. Installable as a PWA.

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
- AG Grid (react-data-grid) + hot-formula-parser (sheet engine)
- Yarn (package manager)

## Where things live

- `src/app/` — Next.js App Router pages and layouts
- `src/app/layout.tsx` — root layout with full SEO metadata + PWA manifest link
- `src/app/not-found.tsx` — custom 404 page
- `src/app/sitemap.ts` — auto-generated sitemap for SEO
- `src/app/sheet.css` — sheet dark mode tokens and DataGrid overrides (inc. dark cell !important rules)
- `src/components/` — React components (UI, sheet editor, navigation)
- `src/components/individual/sheet/Sheet-client.tsx` — main sheet editor (~3072 lines, uses extracted helpers)
- `src/components/individual/sheet/sheet-ui-helpers.tsx` — extracted: IconBtn, ToolSep, CommentDot, CollabCursor, SheetAvatar, ddStyle, getMemberColor etc.
- `src/components/individual/sheet/dialogs/` — Formula-dialog, Select-options-dialog, Keyboard-shortcuts-dialog, Share-dialog
- `src/context/AuthContext.tsx` — Supabase auth context
- `src/lib/supabase/` — Supabase client (browser + server)
- `src/hooks/sheets/` — formula engine and sheet hooks
- `src/data/` — static data (FAQs, templates, etc.)
- `src/lib/sheet-templates.ts` — template data; all templates default to **100 rows**
- `middleware.ts` — route protection (redirect unauthenticated users to `/`)
- `next.config.ts` — Next.js config with Replit-compatible settings
- `public/manifest.json` — PWA manifest
- `public/sw.js` — service worker (PWA install + push notifications)
- `public/robots.txt` — search engine crawl rules

## Architecture decisions

- **compress: true** in next.config.ts — required to gzip JS chunks (~2.7MB → ~627KB) so they load through the Replit proxy without timing out
- **Supabase SSR** via `@supabase/ssr` for cookie-based auth on server and client
- **Middleware** protects all routes except `/` — redirects logged-out users to landing page
- **NEXT_PUBLIC_*** env vars are Replit secrets, injected at runtime in dev mode
- **allowedDevOrigins** includes `*.pike.replit.dev` for HMR to work through the Replit proxy
- **Sheet component extraction**: UI helpers in `sheet-ui-helpers.tsx`, dialogs in `dialogs/` — Sheet-client.tsx is the main orchestrator
- **PWA**: `public/sw.js` service worker handles push notifications and offline caching; registered in layout.tsx via `next/script afterInteractive`
- **Dark mode cells**: `!important` overrides in `sheet.css` ensure react-data-grid's built-in white background cannot bleed through the dark theme
- **Kebab-case naming convention**: all component files use kebab-case (e.g., `App-sidebar.tsx`) — PascalCase duplicates deleted

## Product

Landing page + authenticated spreadsheet app. Users sign in with Google OAuth via Supabase. Features: real-time collaboration, formula engine (100+ functions), templates (100 default rows), organizations/teams, Excel/CSV import-export, activity history, PWA installable, push notifications ready.

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
- Deleting a file that Next.js has cached requires a full workflow restart (not just Fast Refresh)
- All components follow kebab-case naming — never create PascalCase duplicates

## Pointers

- Supabase dashboard: https://supabase.com/dashboard/project/_/settings/api
