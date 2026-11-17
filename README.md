# ticketoff-web

Web app for ticketoff — organizer + attendee + admin portal (academic MVP).

- **Stack:** React · TypeScript · Vite · Tailwind CSS · TanStack Query · React Router
- **Role owners:** Frontend dev (primary), Mobile dev (support after mobile core is done)
- **API types:** generated from the backend's `/openapi.json` via `openapi-typescript` — do not hand-write API types.

## Getting started

```bash
npm install
echo 'VITE_API_BASE_URL=/api' > .env.local   # dev: Vite proxies /api to the API
npm run dev                                   # http://localhost:5173
```

The proxy target is `https://api.ticketoff.store` by default (CORS there allows only
`ticketoff.store`, so the browser must not call it from localhost directly). For a local
backend: `API_PROXY_TARGET=http://localhost:8000 npm run dev`.

Regenerate API types (from production by default, or set `OPENAPI_URL`):

```bash
npm run gen:api-types
OPENAPI_URL=http://localhost:8000/openapi.json npm run gen:api-types
```

This regenerates `src/lib/api/schema.d.ts`. Never edit that file by hand.

## Deploy

`scripts/deploy.sh` builds with `VITE_API_BASE_URL=https://api.ticketoff.store` and uploads
`dist/` to the server (`/opt/ticketoff/web`), where Caddy serves it on https://ticketoff.store
(config in `ticketoff-backend/deploy/Caddyfile`). Needs the SSH key `~/.ssh/ticketoff_ed25519`.

## Structure

```
src/
  features/<feature>/     # events, tickets, organizer, attendee, admin, auth
    pages/                # route-level components
    components/           # feature-scoped components
    hooks/                 # feature-scoped TanStack Query hooks etc.
  components/
    ui/                    # shared, feature-agnostic presentational components
    layout/                # app shell / nav
  lib/
    api/                   # client.ts (fetch wrapper) + schema.d.ts (generated)
    queryClient.ts
  hooks/                   # shared hooks
  types/                   # shared types not covered by generated schema
  router.tsx
  main.tsx
```

Each feature is self-contained: pages call feature hooks, feature hooks call
`apiClient` from `src/lib/api/client.ts` and use generated types from
`src/lib/api/schema.d.ts`. Avoid fetching directly from components.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run gen:api-types` | Regenerate `src/lib/api/schema.d.ts` from backend `/openapi.json` |

## Conventions

Branching, commits, and PR rules: see `CONTRIBUTING.md` (WIP) and the
shared team git-flow guide (posted in team chat).

## Team & workflow

- Task tracking: Jira (Scrum, 2-week sprints)
- All changes land on `main` through a Pull Request (1 approval, squash
  merge, linear history)
