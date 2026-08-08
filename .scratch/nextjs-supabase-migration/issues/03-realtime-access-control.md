# F-03 — Realtime access-control decision

Type: grilling
Status: resolved
Blocked by: F-02 (02-realtime-authorization-facts)

## Question

Which mechanism secures Supabase Realtime subscriptions under custom JWT auth? (Options and tradeoffs from F-02; decision is the user's.)

Grill the user one question at a time; resolve with domain-modeling on the security posture (who can see what live). Record the decision under `## Answer`, then B-03 can proceed.

## Answer

1. **Mechanism: (b) backend-minted Supabase JWT** — FastAPI adds a token endpoint (e.g. `POST /realtime-token`) that signs a JWT with the Supabase project secret: `role=authenticated`, `sub=user_id`, short `exp`. Frontend calls `supabase.realtime.setAuth(jwt)` before subscribing; refresh on expiry via the realtime `access_token` message.
2. **Delete leak: accepted** — no soft-delete rework, no `REPLICA IDENTITY FULL`. DELETE events may carry PK + existence across users; acceptable for a single-user-app reality. RLS still scopes INSERT/UPDATE delivery.
3. Deferred to B-03: the concrete RLS policy rules (which user-scoping columns) and which entities publish.
