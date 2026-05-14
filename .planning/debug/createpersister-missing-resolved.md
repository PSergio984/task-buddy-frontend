---
status: investigating
trigger: "Uncaught SyntaxError: The requested module '/node_modules/.vite/deps/@tanstack_react-query-persist-client.js?v=aceeab46' does not provide an export named 'createPersister' (at main.tsx:13:10)"
created: 2024-05-24T10:00:00Z
updated: 2024-05-24T10:15:00Z
---

## Current Focus

hypothesis: `createPersister` was renamed to `experimental_createQueryPersister` in TanStack Query v5, and its usage differs from previous versions.
test: Verify the export name in `node_modules` and check the return type to see if it's compatible with `PersistQueryClientProvider`.
expecting: Export exists as `experimental_createQueryPersister` but is intended for "Managed Persistence" rather than client-level persistence.
next_action: Confirm if the user wants Managed Persistence or Client Persistence, and implement the corresponding fix.

## Symptoms

expected: Application should load without syntax errors, successfully setting up TanStack Query persistence.
actual: "Uncaught SyntaxError: The requested module '/node_modules/.vite/deps/@tanstack_react-query-persist-client.js?v=aceeab46' does not provide an export named 'createPersister' (at main.tsx:13:10)"
errors: ["The requested module ... does not provide an export named 'createPersister'"]
reproduction: Start the development server and check the browser console.
started: Unknown (detected during integration)

## Eliminated

- hypothesis: Missing dependency `@tanstack/react-query-persist-client`.
  evidence: `package.json` contains `@tanstack/react-query-persist-client@^5.100.10`.
  timestamp: 2024-05-24T10:05:00Z

## Evidence

- timestamp: 2024-05-24T10:10:00Z
  checked: `node_modules/@tanstack/react-query-persist-client/build/modern/index.js` and types.
  found: The package re-exports from `@tanstack/query-persist-client-core`. The actual export is `experimental_createQueryPersister`, not `createPersister`.
  implication: The import in `main.tsx` is using an incorrect name.

- timestamp: 2024-05-24T10:12:00Z
  checked: `experimental_createQueryPersister` implementation in `query-persist-client-core`.
  found: It returns an object with `persisterFn`, `persistQuery`, etc. It does NOT implement the `Persister` interface (which requires `restoreClient` and `persistClient`) expected by `PersistQueryClientProvider`.
  implication: Even if renamed, it will fail at runtime when passed to `PersistQueryClientProvider`.

## Resolution

root_cause: `createPersister` is not an export of `@tanstack/react-query-persist-client` in TanStack Query v5. The user was trying to use a non-existent API or the renamed `experimental_createQueryPersister`. Additionally, using `experimental_createQueryPersister` with `PersistQueryClientProvider` is incorrect as it is designed for "Managed Persistence" (per-query) rather than "Client Persistence" (whole cache).
fix: Installed `@tanstack/query-async-storage-persister`, which provides the correct `createAsyncStoragePersister` for use with async storage like `idb-keyval` and `PersistQueryClientProvider`. Updated `main.tsx` to use this new persister and moved `buster` and `maxAge` to the appropriate `persistOptions` location.
verification: The code now uses the official TanStack Query v5 API for Client Persistence with async storage. Syntax errors are resolved by using correct exports.
files_changed: ["package.json", "src/main.tsx"]
