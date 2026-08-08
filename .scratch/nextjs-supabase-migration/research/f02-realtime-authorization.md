# F02 — Securing Supabase Realtime with custom backend-issued JWTs

App context: auth is a FastAPI-issued HS256 JWT (httpOnly cookie). Frontend migrates to Next.js. Supabase Realtime (postgres_changes) replaces 30s polling. All writes come from the FastAPI backend.

Primary sources: supabase.com/docs (realtime, api, auth, database), supabase/realtime + supabase/realtime-js source (GitHub), postgresql.org docs. All claims cited inline.

---

## 1. Realtime authorization model

**API key vs JWT — two layers.**
- The API key identifies the *application component*, not the user. "An API key authenticates an application component... The API key does not distinguish between users, only between applications." — https://supabase.com/docs/guides/api/api-keys#overview
- The JWT identifies the *user* and carries the Postgres role + claims used for RLS. JWT `role` claim: "The Postgres role to use when applying Row Level Security policies"; `sub`: unique user ID. — https://supabase.com/docs/guides/auth/jwts#introduction

**Wire level:**
- WebSocket handshake URL: `wss://<PROJECT_REF>.supabase.co/realtime/v1/websocket?apikey=<API_KEY>` — the API key is a query param. — https://supabase.com/docs/guides/realtime/protocol#websocket-connection-setup
- The per-user JWT is **not** an `Authorization` header on the WebSocket. It is sent per channel in the `phx_join` payload field `access_token`: "Optional access token for authentication, if not provided, the server will use the API key." — https://supabase.com/docs/guides/realtime/protocol#phx-join
- Token refresh mid-session uses the `access_token` channel message. — https://supabase.com/docs/guides/realtime/protocol#accesstoken
- realtime-js source confirms: constructor throws "API key is required to connect to Realtime" unless `params.apikey` is set; WS headers are deprecated ("headers cannot be set on websocket connections"); `setAuth()` docstring: "Sets the JWT access token used for channel subscription authorization and Realtime RLS." — https://github.com/supabase/realtime-js/blob/master/src/RealtimeClient.ts (lines ~160–176, ~405)

**JWT claims Realtime checks:**
- Server verifies signature and requires `role` and `exp`: error "Fields `role` and `exp` are required in JWT" — https://github.com/supabase/realtime/blob/main/lib/realtime_web/channels/realtime_channel.ex (confirm_token, ~line 805)
- `role` → the Postgres role the connection runs as; `sub` → subject; full claims surface to RLS as `request.jwt.claims` (readable via `current_setting('request.jwt.claims')`). — https://supabase.com/docs/guides/realtime/authorization#jwt-claims ; server assigns authorization context from `claims["role"]` and `claims["sub"]` — https://github.com/supabase/realtime/blob/main/lib/realtime_web/channels/realtime_channel.ex (~line 951)

**Signing key:** the project JWT secret (legacy HS256). `anon`/`service_role` keys ARE JWTs signed with it; custom JWTs must be signed with the same secret (or a key the project trusts via the signing-keys system). Server verifies with `jwt_secret` (decrypted) plus optional JWKS. — https://supabase.com/docs/guides/auth/signing-keys#overview ; realtime_channel.ex `confirm_token`.

**supabase-js channels:** the JWT rides in the join payload, not a header. For REST the `Authorization: Bearer <jwt>` header is used; for realtime it is not. — https://supabase.com/docs/guides/auth/jwts#using-custom-or-third-party-jwts ; https://supabase.com/docs/guides/realtime/protocol#phx-join

---

## 2. RLS gating of Realtime (postgres_changes)

**Yes — RLS applies to row delivery:**
- "When using Postgres Changes on tables with RLS, database records are sent only to clients who are allowed to read them based on your RLS policies." — https://supabase.com/docs/guides/realtime/authorization#interaction-with-postgres-changes
- Enforcement is per-subscriber per-event: "Postgres Changes authorizes every event against each subscriber. When you make a single change to a table with 100 subscribed users, Realtime performs 100 authorization checks — one per user." — https://supabase.com/docs/guides/realtime/postgres-changes#scaling-postgres-changes
- Policies run with the subscriber's role + JWT claims, so `using ((select auth.uid()) = user_id)` works end-to-end. — https://supabase.com/docs/guides/database/postgres/row-level-security#helper-functions ; https://supabase.com/docs/guides/realtime/authorization#jwt-claims

**Caveats (both are footguns):**
- **DELETE events are NOT RLS-filtered**: "RLS policies are not applied to DELETE statements, because there is no way for Postgres to verify that a user has access to a deleted record." — https://supabase.com/docs/guides/realtime/postgres-changes#receiving-old-records
- **Old records need REPLICA IDENTITY FULL**: "By default, only `new` record changes are sent... set the `replica identity` of your table to `full`" to receive `old` on UPDATE/DELETE; DELETE *filters* also require it. With default identity, DELETE payloads carry only the primary key. — https://supabase.com/docs/guides/realtime/postgres-changes#receiving-old-records ; https://supabase.com/docs/guides/realtime/postgres-changes#limitations
- Payload trimming: `select: [...]` restricts columns (PK always included); server-side filters (`id=eq.1`) drop non-matching events before delivery — filters are client-supplied, i.e. NOT authorization. — https://supabase.com/docs/guides/realtime/postgres-changes#selecting-specific-columns ; https://supabase.com/docs/guides/realtime/postgres-changes#available-filters
- Private schemas: need explicit `GRANT SELECT ... TO <role>` plus RLS. — https://supabase.com/docs/guides/realtime/postgres-changes#private-schemas
- Access policies are cached per connection; re-evaluated on connect/join and on `access_token` refresh. "If a new JWT is never received on the Channel, the client will be disconnected when the JWT expires." — https://supabase.com/docs/guides/realtime/authorization#updating-rls-policies
- Channel-level (Broadcast/Presence) access is separately gated by RLS on `realtime.messages` (private channels, `config: { private: true }`). — https://supabase.com/docs/guides/realtime/authorization

---

## 3. Options for custom-JWT apps

### (a) anon key + RLS policies
Client presents only the anon (or publishable) key → "the server will use the API key" as the token. — https://supabase.com/docs/guides/realtime/protocol#phx-join
Consequence: role = `anon`, **no user identity** — `auth.uid()` is NULL and `auth.uid() = user_id` silently fails. — https://supabase.com/docs/guides/database/postgres/row-level-security#authenticated-and-unauthenticated-roles
So policies can only be `using (true)`-style (everyone with the key sees **all** rows of the subscribed table) or deny-all. No per-user filtering.
Tradeoffs: zero backend changes; safe only if subscribed tables are not user-scoped. Any user-scoped data (tasks, notifications) in a subscribed table is readable by anyone with the key. Viable for e.g. public/shared data only.

### (b) Map custom JWT → Supabase-signed JWT (backend minted) — **the documented path**
Docs explicitly support this for Realtime: "You may choose to sign your own tokens to customize claims that can be checked in your RLS policies." — https://supabase.com/docs/guides/realtime/postgres-changes#custom-tokens
What the FastAPI backend mints (claims required by Realtime):
- `role`: an existing Postgres role — `authenticated` (or `anon`) — https://supabase.com/docs/guides/auth/signing-keys#how-to-create-mint-jwts-if-access-to-the-private-key-or-shared-secret-is-not-possible
- `sub`: user ID (used by `auth.uid()`) — same source
- `exp`: future timestamp; "Prefer shorter-lived tokens." — same source
- Signed with the project JWT secret (HS256) — found in Dashboard > Settings > API keys — https://supabase.com/docs/guides/realtime/postgres-changes#custom-tokens ; or with an imported signing key (asymmetric/shared secret) the project trusts — https://supabase.com/docs/guides/auth/signing-keys#overview
Client wiring: `supabase.realtime.setAuth(customJwt)` after client init, before subscribing — https://supabase.com/docs/guides/realtime/postgres-changes#custom-tokens (JS/Dart/Swift/Kotlin/Python/C# examples); or the `accessToken` callback — https://supabase.com/docs/guides/auth/jwts#using-custom-or-third-party-jwts
Security notes: JWT secret must live only on the FastAPI backend. Short `exp` + in-band refresh via the `access_token` message (otherwise the channel closes on expiry) — https://supabase.com/docs/guides/realtime/protocol#access-token-refresh . Caveat: minted tokens only verify while the signing secret/key remains trusted by the project (revoking the legacy JWT secret breaks them); anon/service_role keys are themselves JWTs signed with the same secret — https://supabase.com/docs/guides/auth/signing-keys#why-is-revoking-the-legacy-jwt-secret-disallowed
This is a **JWT re-mint endpoint in FastAPI**, not a mapping table: same user identity (`sub`), different signing key + claims.

### (c) service_role key in the browser — **never**
- "Do not expose the `service_role` token on the client because the role is authorized to bypass row-level security." — https://supabase.com/docs/guides/realtime/postgres-changes#custom-tokens
- `service_role` has the `BYPASSRLS` attribute: "skipping any and all Row Level Security policies you attach." — https://supabase.com/docs/guides/api/api-keys#what-secret-keys-allow-access-to
- "These should never be used in the browser or exposed to customers." — https://supabase.com/docs/guides/database/postgres/row-level-security#bypassing-row-level-security
Also note new secret keys are hard-blocked in browsers (HTTP 401 on User-Agent match) — https://supabase.com/docs/guides/api/api-keys#what-secret-keys-allow-access-to

### (d) Backend-proxied realtime — feasible but undocumented/unsupported
- The client *must* present an API key at the WS handshake (`?apikey=` query param; realtime-js throws without it) — https://supabase.com/docs/guides/realtime/protocol#websocket-connection-setup ; https://github.com/supabase/realtime-js/blob/master/src/RealtimeClient.ts (~line 173)
- The per-user JWT is in the `phx_join` payload, so a proxy that terminates/forwards the WebSocket could hold the anon key server-side and inject the user's JWT into join payloads — mechanically possible, but requires WS proxying (reconnects, heartbeats every ≤25s, backoff, sticky routing) with no official support or docs. Docs only describe direct client→realtime connections. Alternative: self-host Realtime (Docker image) behind your own auth-gated endpoint — https://github.com/supabase/realtime (README; self-hosted WS URL form in https://supabase.com/docs/guides/realtime/protocol#websocket-connection-setup)
- Verdict: possible, high operational cost. Option (b) achieves the same security goal with documented, supported client calls.

---

## 4. What RLS requires / effect on FastAPI writes

**Setup requirements:**
- Enable RLS per table + create policies + GRANTs: "RLS must always be enabled on any tables stored in an exposed schema"; default-deny until policies exist: "no data will be accessible via the API when using a publishable key, until you create policies." — https://supabase.com/docs/guides/database/postgres/row-level-security#enabling-row-level-security
- Roles: `anon` (unauthenticated), `authenticated` (authenticated) — the JWT `role` claim selects which. Policies use `TO anon` / `TO authenticated`. — https://supabase.com/docs/guides/database/postgres/row-level-security#authenticated-and-unauthenticated-roles ; https://supabase.com/docs/guides/database/postgres/roles#supabase-roles
- Realtime rows are filtered with the subscriber's role/claims (see §2), so the same policies govern polling-era REST reads and realtime delivery.

**Effect on the FastAPI backend: enabling RLS does NOT break its writes** (it connects as `service_role` or `postgres`):
- `service_role` "is used by the API (PostgREST) to bypass Row Level Security"; has `BYPASSRLS`. — https://supabase.com/docs/guides/database/postgres/roles#supabase-roles ; https://supabase.com/docs/guides/api/api-keys#what-secret-keys-allow-access-to
- `postgres` is a superuser; "Superusers and roles with the `BYPASSRLS` attribute always bypass the row security system when accessing a table. Table owners normally bypass row security as well." — https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- If FastAPI ever switched to a plain role, RLS default-deny would block it — it would need its own policies or `BYPASSRLS`. — https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

## 5. Realtime limits (relevance to a task app)

From the limits matrix (Free / Pro / higher): — https://supabase.com/docs/guides/realtime/limits#limits-by-plan
- **Channels per connection: 100** (all plans).
- **Messages per second (tenant-wide):** Free 100, Pro 500, Pro-no-cap/Team 2,500. Exceeding disconnects (`tenant_events`); supabase-js auto-reconnects. — https://supabase.com/docs/guides/realtime/limits#limit-errors
- **Channel joins per second:** Free 100 / Pro 500.
- **Presence:** 20 (Free) / 50 (Pro) msgs per second; 5 presence calls per client per 30s; presence keys per object: 10.
- **Broadcast payload:** 256 KB (Free) / 3,000 KB (Pro).
- **Postgres change payload:** 1,024 KB; when exceeded, `new`/`old` include only fields ≤ 64 bytes. — https://supabase.com/docs/guides/realtime/limits#postgres-changes-payload-limit
- "Connection pool size" is a project-side DB concern (errors `IncreaseConnectionPool` / `DatabaseLackOfConnections`), not a client limit. — https://supabase.com/docs/guides/realtime/protocol#join-errors
- Throughput note: postgres_changes authorizes per subscriber per event; ~3,000+ concurrent subscribers on one table → switch to Broadcast. — https://supabase.com/docs/guides/realtime/postgres-changes#scaling-postgres-changes

Task app (tasks/tags/projects/notifications): ~4–8 channels per user ≪ 100; payloads are small (KBs ≪ 1,024 KB); tenant msg/s limits are non-issues at this scale. Deletes bypass RLS — if task rows are user-scoped, a user subscribed to a table receives DELETE events for rows they could not read (PK only unless REPLICA IDENTITY FULL, in which case full old rows leak). Design around §2 caveats.

---

## 6. Frontend subscription shape

Channel + postgres_changes binding (JS):

```js
const supabase = createClient(URL, PUBLISHABLE_OR_ANON_KEY)
supabase.realtime.setAuth(customJwt) // option (b)

const ch = supabase
  .channel('tasks-live')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'tasks', filter: 'user_id=eq.<me>' },
    (payload) => { /* normalized payload */ }
  )
  .subscribe()
```

Wire payload (protocol): — https://supabase.com/docs/guides/realtime/protocol#postgreschanges

```json
{
  "ids": [104868189],
  "data": {
    "schema": "public",
    "table": "tasks",
    "commit_timestamp": "2025-11-19T00:22:40.877Z",
    "type": "UPDATE",            // INSERT | UPDATE | DELETE
    "columns": [ { "name": "id", "type": "int8" } ],
    "record": { ... },           // new row (INSERT/UPDATE)
    "old_record": { ... },       // old row (UPDATE/DELETE; PK-only unless REPLICA IDENTITY FULL)
    "errors": null
  }
}
```

supabase-js normalizes it before the callback: `{ schema, table, commit_timestamp, eventType, new: record, old: old_record, errors }` — https://github.com/supabase/realtime-js/blob/master/src/RealtimeChannel.ts (postgres changes binding, ~line 715)

Event semantics: INSERT → `new` = inserted row; UPDATE → `new` + `old` (old PK-only by default); DELETE → `old` only (PK-only by default). Use `select: [...]` to trim payloads (PK always included). — https://supabase.com/docs/guides/realtime/postgres-changes#selecting-specific-columns

---

## Open questions

1. **Signing state of the Supabase project**: still on legacy JWT secret (HS256) or migrated to asymmetric signing keys? Option (b) must sign with whatever the project currently trusts; minted JWTs break if the legacy secret is later revoked (anon/service_role deprecation is slated for end of 2026 — https://supabase.com/docs/guides/api/api-keys#overview ).
2. **User-scoping model**: do tasks/tags/projects/notifications carry a `user_id` column so RLS policies can use `auth.uid()` (= `sub` claim)? Any shared/team-scoped data needs a different policy shape.
3. **DELETE-event exposure**: with RLS not applying to DELETE events, decide whether subscribed tables keep default replica identity (PK-only leak) or REPLICA IDENTITY FULL (full old row leak to every subscriber of that table).
4. **Notification delivery**: per-user notifications are fine via per-user policies, but confirm the app is OK with a channel per notifications table (channel-count limit 100) and whether reads should be RLS-gated or backend-only.
5. **FastAPI connection role**: confirm it connects as `service_role`/`postgres` (bypasses RLS) so enabling RLS never breaks writes; also verify no table-owner assumptions.
6. **JWT re-mint endpoint**: does FastAPI need a `/realtime-token` endpoint (short exp, role=authenticated, sub=user_id) that the Next.js client calls on connect and before expiry, or is the existing cookie JWT re-signable server-side?
7. **Backend proxy (option d)**: only pursue if anon/publishable key cannot be present in the browser bundle at all — a Next.js API route could hold it, but WS proxying is unsupported and complex.
