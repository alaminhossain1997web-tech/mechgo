# PothSeba Backend

## Real-time service requests

The existing `npm start` command starts Express and Socket.IO on the same HTTP server and port. Socket authentication uses the existing `JWT_ACCESS_SECRET` and token format (`id` claim); Socket.IO verifies the token and reloads the account from MongoDB. Technicians must have a Technician profile. The socket handshake is:

```js
io(API_ORIGIN, { auth: { token: accessToken }, withCredentials: true });
```

Allowed socket origins are localhost:5173 and the deployed PothSeba frontend, plus comma-separated optional `FRONTEND_URL` values. The server assigns rooms after authentication: `technician:<Technician profile _id>` and `rider:<User _id>`. Clients cannot join rooms themselves.

Events:

- `request:new` goes only to the assigned Technician. Payload: `{ requestId, rider: { id, name }, riderId, technicianId, serviceId, serviceName, description, location: { type: "Point", coordinates: [longitude, latitude] }, status, createdAt }`.
- `request:updated` goes to the Technician and Rider. Payload: `{ requestId, status, riderId, technicianId, createdAt, updatedAt }`.
- After acceptance, the assigned Technician may emit `technician:location:update` with `{ requestId, coordinates: [longitude, latitude] }`. The server derives the Technician from the authenticated socket, verifies request ownership and `accepted` status, stores the point on that request, then emits `technician:location` only to the assigned Rider with `{ requestId, technicianId, coordinates, timestamp }`. Updates are limited to one per request per Technician every 3 seconds. Invalid or unauthorized updates return an optional acknowledgement `{ success: false, error: { code, message } }` and emit `technician:location:error` with the same error object. Success acknowledgement is `{ success: true, data: { requestId, technicianId, coordinates, timestamp } }`.

Socket delivery is best effort; MongoDB and the REST APIs remain the source of truth.

## Request APIs

All endpoints use the existing `BASE_URL` prefix (normally `/api/v1`) and require `Authorization: Bearer <accessToken>` or the existing accessToken cookie.

- `POST /api/v1/request/createRequest` (Rider): body `{ "technicianId": "<Technician profile id>", "serviceId": "<service id>", "location": { "type": "Point", "coordinates": [longitude, latitude] }, "description": "..." }`. Preserves the existing 201 response shape: `{ success, message, data: { request } }`. Emits `request:new` after persistence.
- `GET /api/v1/request/my-requests` (Rider): returns only the authenticated Rider's requests, including service and safe Technician profile fields.
- `GET /api/v1/request/:requestId/location` (Rider): retrieves the latest persisted location only when the authenticated Rider owns the accepted request. Returns `{ success: true, data: { requestId, technicianId, coordinates, timestamp } }`; 400 for invalid IDs, 401 unauthenticated, 403 for non-Riders, 404 if the request is not owned or no location has arrived, and 409 when tracking is no longer active.
- `GET /api/v1/technician/request/getrequest` (Technician): existing endpoint returns that Technician's pending requests.
- `PATCH /api/v1/request/:requestId/status` (Technician): body `{ "status": "accepted" }` or `{ "status": "rejected" }`. Returns 200 with `data.request`; 400 for invalid ID/status, 401 when unauthenticated, 403 for non-Technician accounts, 404 for missing profile or a request not assigned to that Technician, and 409 if the owned request is no longer pending. The atomic transition emits `request:updated` only after MongoDB succeeds.

## Two-client smoke test

1. Start the server with the configured `DB_URL`, `JWT_ACCESS_SECRET`, `BASE_URL`, and `PORT` (default 8000). Log in separately as a Rider and approved Technician; retain each login response's `data.accessToken`.
2. Connect each client to the API origin with its token in `auth.token`. Confirm each connection succeeds. Connecting with a missing, malformed, or expired token must fail with a safe authentication error; a Technician account without a profile must fail with `Technician profile not found`.
3. On the Technician client, listen for `request:new`. From Rider A, POST a request using the Technician profile ID and one of their offered services. Confirm MongoDB stores a pending request and only that Technician receives the event. Rider B and other Technicians should not receive it. Check its IDs, service name, description, GeoJSON coordinates, status, and creation timestamp.
4. Refresh/recover via the Technician pending list and Rider `my-requests` endpoint. On both clients listen for `request:updated`. PATCH the new request to accepted (or rejected) as the assigned Technician; confirm the DB value and both clients' event payloads.
5. Repeat the PATCH; expect 409 and no second successful transition. Try the same PATCH as the Rider or a different Technician; expect 403 or 404. Try malformed request IDs (400), a non-pending owned request (409), and a Technician login with no profile (404 for REST; connection rejected for sockets).
6. After acceptance, have the assigned Technician emit `technician:location:update` with a valid request ID and longitude/latitude pair. Confirm only the assigned Rider receives `technician:location`, and the Rider can refresh via `GET /api/v1/request/:requestId/location`. Send another point inside 3 seconds (expect `RATE_LIMITED`), an invalid coordinate (expect `INVALID_COORDINATES`), and an update for another Technician's or non-accepted request (expect `TRACKING_UNAVAILABLE`). Verify the Technician profile's permanent `location` remains unchanged. Complete/end a request through any available lifecycle path and confirm location updates are rejected and REST recovery returns 409.

## Checks

Run `npm test` to check the status route mount without a database and the Socket.IO polling transport/CORS handshake. Syntax checks can be run with `node --check` on the changed JavaScript files. These checks do not exercise database-backed request updates or deployed service behavior.
