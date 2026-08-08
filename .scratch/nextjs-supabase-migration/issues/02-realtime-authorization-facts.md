# F-02 — Supabase Realtime authorization facts (custom JWT)

Type: research
Status: resolved
Blocked by: —

## Question

Facts needed to decide how to secure Supabase Realtime subscriptions when the app uses **custom JWT auth (backend-issued), not Supabase Auth**:

- How Supabase Realtime authorizes subscribers: anon key vs JWT, what claims are checked, how RLS policies gate realtime rows.
- Options and their tradeoffs: (a) anon key + RLS policies, (b) mapping the custom JWT to a Supabase JWT (signing/verification, `sub`/role claims, expiry), (c) service-role key in the browser (explicitly note why this is dangerous), (d) backend-proxied realtime.
- What RLS requires at the Postgres level (policies on tables, roles), and whether Realtime bypasses RLS for the service role.
- Any Supabase Realtime limits (channels, messages, connection pool) relevant to a task app.
- How the frontend would subscribe (supabase-js `channel`) and what the payload looks like for INSERT/UPDATE/DELETE.

Resolve via primary sources (Supabase docs). Save findings to `task-buddy-frontend/.scratch/nextjs-supabase-migration/research/f02-realtime-authorization.md`, then link from here.

## Answer

Findings: `research/f02-realtime-authorization.md`. Key facts: option (b) is the documented path — FastAPI mints JWT signed with the project JWT secret, claims `role=authenticated` (must be an existing Postgres role), `sub=user_id`, `exp`; frontend calls `supabase.realtime.setAuth(jwt)` before subscribing. No headers in WS handshake — `?apikey=` query param (anon key, public) + `access_token` in phx_join payload. RLS gates postgres_changes delivery per-subscriber, BUT: DELETE events bypass RLS; old records (UPDATE/DELETE) need REPLICA IDENTITY FULL. Enabling RLS won't break FastAPI: service_role has BYPASSRLS, postgres is superuser. Option (a) anon key is a trap (auth.uid() NULL → per-user policies silently fail); (c) service_role in browser forbidden; (d) proxy feasible but unsupported. Limits: 100 channels/conn, 1,024 KB payloads, 100–2,500 msg/s by plan. Open: legacy JWT secret vs asymmetric signing keys (deprecation end of 2026), DELETE-event policy, `/realtime-token` endpoint acceptability.
