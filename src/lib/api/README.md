# src/lib/api

- `schema.d.ts` — generated from the backend's `/openapi.json` via
  `openapi-typescript` (`npm run gen:api-types`). **Do not hand-edit.**
- `client.ts` — thin `fetch` wrapper (`apiClient.get/post/patch/put/delete`)
  shared by every feature. Handles base URL, JSON body/headers, and auth
  token injection (TODO once auth lands).

Feature-level API calls should live in each feature's own folder, e.g.
`src/features/events/api.ts`, and import types from `./schema` + call
through `apiClient` — do not fetch directly from components.
