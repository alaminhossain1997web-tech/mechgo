+# API Runtime Test Results

Audit date: 2026-11-09 (Asia/Dhaka). No credentials or tokens are included.

## Summary

- Fresh npm start in the sandbox: NOT SUCCESSFUL in that attempt. It exited with Mongo connection error: querySrv ETIMEOUT for the configured MongoDB SRV host. Host/credential values omitted. A separate approved read-only DB query later connected successfully outside the restricted network context.
- HTTP listener observation: localhost:8000 returned JSON from a process already listening on the port, including after the fresh start failed. Process provenance/build could not be identified in the sandbox, so this does not prove the current checkout started successfully.
- Admin token: none was provided or available for this audit. Authenticated Admin API tests: NOT TESTED.
- MongoDB aggregate record counts: TESTED READ-ONLY after network approval. Counts returned: Users 6; Technicians pending 1, approved 3, rejected 0 (total 4); Pumps pending 0, approved 3, rejected 0 (total 3); Areas Zone 10, Ward 54, Neighbourhood 0 (total 64); Services 7; Reviews 0. No IDs, names, emails, credentials or document contents were queried or recorded.
- Detailed Area parent/child graph: NOT TESTED. Counts are per type only.
- Mutations: NOT TESTED; no writes were attempted.
- Route registration: source-inspected. 46 HTTP method/path endpoints are mounted including root, of which 22 are Admin endpoints. This is static source verification, not runtime authentication verification.

## HTTP observations

All requests were sent without credentials.

| Method/path | Status | Content-Type | Result | Interpretation |
|---|---:|---|---|---|
| GET http://127.0.0.1:8000/ | 200 | application/json; charset=utf-8 | JSON success: true, message PothSeba Backend is running | Observed from local listener; fresh start failed and an existing listener remained, so attribution to current start is uncertain. |
| GET /api/v1/area/list | 401 | application/json; charset=utf-8 | {"success":false,"message":"Unauthorized request"} | NOT a successful endpoint test; endpoint is behind protect. |
| GET /api/v1/allservice/getallService | 401 | application/json; charset=utf-8 | {"success":false,"message":"Unauthorized request"} | NOT a successful endpoint test; service GET is protected. |
| GET /api/v1/admin/area/all_areas | 401 | application/json; charset=utf-8 | {"success":false,"message":"Unauthorized request"} | NOT a successful Admin endpoint test; no Admin token supplied. |

A 401 is an authentication failure, not route/API success. Since the app applies protect to route groups, it also does not prove an unregistered endpoint is mounted.

## Startup/database attempt

Command: npm start.

Observed: dotenvx reported environment injection; the fresh Node process then reported Database connection failed: querySrv ETIMEOUT for the configured MongoDB SRV hostname. No DB values are recorded. index.js only calls listen after dbConnect resolves, so this fresh process did not start listening successfully.

The port 8000 health response remained available, indicating a separate or pre-existing listener. Its process identity/build could not be inspected because the process query was denied, so no assumptions are made about its route code or DB state. A read-only aggregate query executed with approved network access connected to MongoDB successfully and returned the counts below; this proves DB reachability for that query but not that a fresh npm start in the restricted sandbox succeeds.

## Test coverage by requirement

| Test | Status | Notes |
|---|---|---|
| Static route registration | SOURCE VERIFIED | Aggregator trace; 46 mounted paths incl root, 22 Admin; unmounted area zones route identified |
| Root health GET | OBSERVED 200 | Local listener returned JSON; attribution caveat above |
| Protected public GET with no token | TESTED → 401 | Does not count as success |
| Protected Admin GET with no token | TESTED → 401 | Does not count as success |
| Public GET that works without auth | NONE FOUND beyond root | PublicRoutes area/pump/review endpoints all use protect |
| Authenticated Admin GET | NOT TESTED | No token available |
| Mutations | NOT TESTED | No test data; no write attempted |
| Technician status counts | TESTED READ-ONLY | pending 1, approved 3, rejected 0 |
| Area type counts | TESTED READ-ONLY | Zone 10, Ward 54, Neighbourhood 0; parent-child structure not queried |
| Pump approval counts | TESTED READ-ONLY | pending 0, approved 3, rejected 0 |
| Service count | TESTED READ-ONLY | 7 |
| Review count | TESTED READ-ONLY | 0 |
| User count | TESTED READ-ONLY | 6 |

## Re-test requirements

1. Make the configured MongoDB SRV hostname resolvable/reachable from runtime.
2. Start the current checkout and confirm both Database connected and PothSeba server is running logs.
3. Obtain an existing Admin JWT via normal login without placing it in docs/logs.
4. Re-run GET tests and record status, JSON content type, and sanitized field shapes.
5. Use read operations only for production verification; run mutations only against dedicated test data.
