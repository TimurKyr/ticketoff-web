# src/lib/api

- `schema.d.ts` — generated from the backend's `/openapi.json` via
  `openapi-typescript` (`npm run gen:api-types`, source `OPENAPI_URL`,
  default `https://api.ticketoff.store/openapi.json`). **Do not hand-edit.**
- `types.ts` — short aliases for generated schemas (`MeOut`, `TokenOut`, ...).
- `client.ts` — thin `fetch` wrapper (`apiClient.get/post/postForm/patch/put/delete`):
  base URL from `VITE_API_BASE_URL`, JSON or form body, Bearer token from
  `localStorage`, on 401 with a token: log out and open `/login`.
- `errors.ts` — `errorMessage(error, t)`: text for `{"detail": ...}` errors.

Feature-level API calls live in each feature's own folder, e.g.
`src/features/auth/api.ts`: import types from `./types` and call through
`apiClient`, do not fetch directly from components.
