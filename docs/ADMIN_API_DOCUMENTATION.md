# PothSeba Admin Dashboard API Documentation

> Superseded by [BACKEND_COMPLETE_AUDIT.md](BACKEND_COMPLETE_AUDIT.md), [ADMIN_API_REFERENCE.md](ADMIN_API_REFERENCE.md), [FRONTEND_INTEGRATION_GUIDE.md](FRONTEND_INTEGRATION_GUIDE.md), [MISSING_BACKEND_APIS.md](MISSING_BACKEND_APIS.md), and [API_TEST_RESULTS.md](API_TEST_RESULTS.md). The earlier route list incorrectly treated `GET /api/v1/admin/area/zones` as mounted; source audit confirms it is not registered.

This document describes the backend as found in the source files. No backend code was changed for this documentation task. Example IDs and record values below are illustrative and follow the schema; they are not claims about live database contents.

## 1. Backend architecture

### Runtime and URL prefix

- Entry point: `index.js` (Express 5, JSON body parser, cookie parser, CORS, Socket.IO, MongoDB connection).
- `BASE_URL` is `/api/v1` in the current `.env`; route registration uses this value as the API prefix.
- Admin URLs therefore start with `/api/v1/admin`.
- Server listens on `PORT` or `8000`, after MongoDB connects.
- API responses use JSON. Most routes use `{ success, message, ... }`, but a few older controllers use different keys (noted below).

### Main source layout

| Directory | Contents |
|---|---|
| `config/` | env loading, MongoDB connection, Socket.IO |
| `models/` | Mongoose schemas listed in Section 2 |
| `controllers/authController/` | registration, login, logout |
| `controllers/adminContoller/` | admin area, technician approval, pumps, reviews, roles, services |
| `controllers/publicController/` | active areas, public pumps, pump reviews |
| `controllers/PumpAdmin/` | pump owner and pump review operations |
| `controllers/tecnicianController/` | technician profile, request and online status operations |
| `controllers/requestController/` | rider requests, technician search, status/location operations |
| `routes/` | route registration; composed in `routes/index.js` |
| `middlewares/` | JWT authentication and role guards |
| `helpers/` | slug, area boundary, pump area/rating and utility helpers |
| `postman/` | existing Postman request and environment YAML files (partial collection) |

### Models

| Mongoose model | File | Key facts |
|---|---|---|
| `User` | `models/authSchema/userSchema.js` | name, email, password, role; timestamps; roles `User`, `Rider`, `Technician`, `PumpOwner`, `admin` |
| `Technician` | `models/tecnicianSchema/tecnicianSchema.js` | profile linked to User by `userId`; verification status enum |
| `Area` | `models/Area/areaSchema.js` | Zone/Ward/Neighbourhood hierarchy; optional Polygon/MultiPolygon boundary |
| `services` | `models/serviceSchema/serviceSchema.js` | name, description, icon, isActive |
| `Review` | `models/Review/reviewSchema.js` | pump and user refs, rating, comment, isHidden, timestamps; unique pump/user pair |
| `Pump` | `models/pumpSchema/pumpSchema.js` | pump profile, areas, approval workflow, aggregate rating fields |
| `RoleHistory` | `models/RoleHistory/roleHistorySchema.js` | user role changes, actor, reason, request metadata, timestamps |
| `driverRequest` | `models/requestSchema/driverRequestSchema.js` | rider/technician service request data |

### Route registration

`routes/index.js` mounts auth and public routes at `/api/v1`; technician, services, requests, pump owner, and admin routers are mounted at that prefix behind `protect`. `routes/adminRoutes/index.js` adds `/admin` and `adminpass`, then mounts services, pending technician decisions, areas, pumps, review moderation, and role assignment. Admin URLs below reflect the composed registration, not only the leaf router path.

Controller files by area: `controllers/authController/{registrationController,loginController,logoutController}.js`; `controllers/adminContoller/Area_Controller/` contains create, update, status, list, single, hierarchy, children, zones, wards, location lookup, delete; `pending_request/` contains approve/reject; `serviceController/` contains create/list; `pumpController/adminPumpController.js`; `reviewController/toggleReviewHiddenController.js`; `Role Controller/userRoleController.js`; `controllers/publicController/` contains active area, pump list/detail and pump reviews; `controllers/PumpAdmin/` contains pump create/list/update/status/fuels and review create/delete; `controllers/tecnicianController/` contains technician profile, request and status handlers; `controllers/requestController/` contains request creation, technician lookup, rider list, status and location handlers.

### Complete registered route catalog

This catalog lists the current mounted HTTP routes (not Socket.IO events). Auth is open unless stated; “Bearer” means `protect` is mounted.

| Method | URL | Gate |
|---|---|---|
| GET | `/` | Open health response |
| POST | `/api/v1/auth/registration` | Open |
| POST | `/api/v1/auth/login` | Open |
| POST | `/api/v1/auth/logout` | Open |
| GET | `/api/v1/area/list` | Bearer, Rider/admin |
| GET | `/api/v1/pump/by_area` | Bearer, Rider/admin |
| GET | `/api/v1/pump/:pumpId/reviews` | Bearer, Rider/admin |
| GET | `/api/v1/pump/:id` | Bearer, Technician/admin; `my_pumps` is skipped to allow pump-owner route |
| POST | `/api/v1/create-profile/tecnicianprofile` | Bearer |
| GET | `/api/v1/request/getrequest` | Bearer; controller requires Technician |
| PATCH | `/api/v1/technician/status` | Bearer |
| GET | `/api/v1/allservice/getallService` | Bearer |
| GET | `/api/v1/request/findTechnician` | Bearer |
| POST | `/api/v1/request/createRequest` | Bearer |
| PATCH | `/api/v1/request/:requestId/status` | Bearer; controller applies role/ownership checks |
| GET | `/api/v1/request/my-requests` | Bearer |
| GET | `/api/v1/request/:requestId/location` | Bearer; Rider/Technician checks in controller |
| POST | `/api/v1/pump/create` | Bearer |
| GET | `/api/v1/pump/my_pumps` | Bearer |
| PATCH | `/api/v1/pump/my_pumps/:pumpId/update` | Bearer |
| PATCH | `/api/v1/pump/my_pumps/:pumpId/status` | Bearer |
| PATCH | `/api/v1/pump/my_pumps/:pumpId/fuels` | Bearer |
| POST | `/api/v1/pump/:pumpId/review` | Bearer |
| DELETE | `/api/v1/pump/:pumpId/review` | Bearer |
| POST | `/api/v1/admin/services/createService` | Bearer, admin |
| PATCH | `/api/v1/admin/pending_technician/:technicianId/approve` | Bearer, admin |
| PATCH | `/api/v1/admin/pending_technician/:technicianId` | Bearer, admin; approval alias |
| PATCH | `/api/v1/admin/pending_technician/:technicianId/reject` | Bearer, admin |
| POST | `/api/v1/admin/area/create` | Bearer, admin |
| GET | `/api/v1/admin/area/all_areas` | Bearer, admin |
| PATCH | `/api/v1/admin/area/update_areas/:areaId` | Bearer, admin |
| GET | `/api/v1/admin/area/selected_area/:areaId` | Bearer, admin |
| PATCH | `/api/v1/admin/area/:areaId/status` | Bearer, admin |
| POST | `/api/v1/admin/area/find-by-location` | Bearer, admin |
| GET | `/api/v1/admin/area/zones` | Bearer, admin |
| GET | `/api/v1/admin/area/zones/:zoneId/wards` | Bearer, admin |
| GET | `/api/v1/admin/area/hierarchy` | Bearer, admin |
| GET | `/api/v1/admin/area/:areaId/children` | Bearer, admin |
| DELETE | `/api/v1/admin/area/:areaId` | Bearer, admin; soft deactivation |
| GET | `/api/v1/admin/pump/all_pumps` | Bearer, admin |
| GET | `/api/v1/admin/pump/selected_pump/:id` | Bearer, admin |
| PATCH | `/api/v1/admin/pump/approve/:id` | Bearer, admin |
| PATCH | `/api/v1/admin/pump/reject/:id` | Bearer, admin |
| PATCH | `/api/v1/admin/review/:id/hide` | Bearer, admin |
| GET | `/api/v1/admin/role/search` | Bearer, admin |
| PATCH | `/api/v1/admin/role/update/:userId` | Bearer, admin |
| GET | `/api/v1/admin/role/history/:userId` | Bearer, admin |

### Authentication and authorization middleware

- `middlewares/protect.js` gets a JWT from the `accessToken` cookie or `Authorization: Bearer <token>`, verifies it with `JWT_ACCESS_SECRET`, loads the User and sets `req.user`.
- `middlewares/adminpass.js` allows only `req.user.role === "admin"` (lowercase). Admin router calls this after `protect`.
- `middlewares/allowRiderOrAdmin.js` permits `Rider` and lowercase `admin`.
- `middlewares/allowTechnicianOrAdmin.js` permits `Technician` and lowercase `admin`.
- `GET /api/v1/allservice/getallService` only has `protect`: it requires login but has no role-specific restriction.
- Public pump review read uses `allowRiderOrAdmin`; technicians are not allowed by that middleware.
- Pump review write/delete routes are behind global `protect`, but have no explicit role guard in their own router.

## 2. Database schemas

### Technician and User

`Technician` (`models/tecnicianSchema/tecnicianSchema.js`) fields:

| Field | Type | Required/default/details |
|---|---|---|
| `userId` | ObjectId ref `User` | required |
| `shopname` | String | required |
| `phone` | String | required |
| `services` | ObjectId array ref `services` | no schema-level required/minimum |
| `location.type` | String | enum `Point`, default `Point` |
| `location.coordinates` | Number array | required; GeoJSON coordinate order is `[longitude, latitude]` |
| `isOnline` | Boolean | default `false` |
| `isAvailable` | Boolean | default `false` |
| `verificationStatus` | String | enum `pending`, `approved`, `rejected`; default `pending` |

The Technician schema has a 2dsphere index and no timestamps option. `userId` is the User relationship. User fields are `name` (required), `email` (required, unique, lowercase, trimmed), `password` (required and hashed on User save), and `role` (required enum listed above; default `User`); User has timestamps.

Approval and rejection update the existing Technician document's `verificationStatus`. The controller does not delete rejected records, so rejected profiles remain in MongoDB. The admin routes do not provide technician list, detail, or statistics reads. Approval/rejection responds with the updated Technician document under `technician`, without populating the `userId` or `services` references.

### Area hierarchy and fields

Area types are exactly `Zone`, `Ward`, `Neighbourhood`. A Zone has no parent (`parentAreaId: null`); Ward parent is a Zone ObjectId; Neighbourhood parent is a Ward ObjectId. `parentAreaId` is a Mongoose ObjectId ref to `Area`.

Required schema fields: `name` (String), `slug` (String), `type` (enum above), `division` (String), `district` (String). `nameBn`, `upazila`, `cityCorporation` default to empty strings; `zoneNo`, `wardNo`, `areaSqKm` default null; `isActive` defaults true; `createdBy` is an optional User ObjectId. Timestamps are enabled.

`boundary` is optional. When present, the application accepts GeoJSON `{ "type": "Polygon", "coordinates": [...] }` or `{ "type": "MultiPolygon", "coordinates": [...] }`. Coordinates are longitude/latitude positions and each linear ring must have at least four positions and close on its first position. Schema-level validation checks the presence of type and coordinates; controller/helper validation is stricter. Boundary is not mandatory for Zone, Ward, or Neighbourhood.

### Service

Model name is `services` (lowercase/plural). Fields: `name` String, required/unique/trimmed; `description` String, optional default `""`; `icon` String, optional default `""`; `isActive` Boolean default `true`. This schema does not enable timestamps.

### Review and Pump

`Review` fields: `pump` required ObjectId ref `Pump`; `user` required ObjectId ref `User`; `rating` required integer 1–5; `comment` optional trimmed String up to 500 chars; `isHidden` Boolean default false; timestamps supply `createdAt` and `updatedAt`. A unique compound index permits one review per user per pump.

Pump stores `avgRating` and `reviewCount`. `helpers/recalcPumpRating.js` aggregates only reviews with `isHidden: false`, rounds average to one decimal place, and updates those Pump fields. Public pump review listing filters out hidden reviews. The admin hide/unhide controller recalculates aggregates after toggling visibility.

## 3. Technician APIs

### Existing admin decision APIs

All three require a valid login token and lowercase `admin` role. No query parameters or request body are read by these handlers. `technicianId` is the Technician document `_id`, not its linked User `_id`.

| Method | Full URL | Behavior |
|---|---|---|
| PATCH | `/api/v1/admin/pending_technician/:technicianId/approve` | Sets `verificationStatus: "approved"`, `isOnline: false`, `isAvailable: false` |
| PATCH | `/api/v1/admin/pending_technician/:technicianId` | Alias to the same approval controller; same behavior and no body |
| PATCH | `/api/v1/admin/pending_technician/:technicianId/reject` | Sets `verificationStatus: "rejected"`, `isOnline: false`, `isAvailable: false` |

The two approval paths are functionally identical aliases. Neither checks that the current status is `pending`, and neither accepts a rejection reason. Successful shape:

```json
{ "success": true, "message": "Technician approved successfully", "technician": { "_id": "66a000000000000000000001", "userId": "66a000000000000000000002", "shopname": "Example Workshop", "phone": "+8801700000000", "services": [], "location": { "type": "Point", "coordinates": [90.4, 23.8] }, "isOnline": false, "isAvailable": false, "verificationStatus": "approved" } }
```

The reject message is `Technician rejected successfully` and returned status is `rejected`. `404` is `{ "success": false, "message": "Technician not found" }`; caught failures return `500` with `{ "success": false, "message": "Internal server error", "error": "..." }`. Invalid ObjectId is not explicitly handled, so it reaches the catch and normally returns 500.

### Requested routes: existence check

| Requested URL | Status | Finding |
|---|---|---|
| `GET /api/v1/admin/technicians` | **MISSING** | No registered list route/controller. Existing Technician model can support filtering/pagination, but no current query behavior exists. |
| `GET /api/v1/admin/technicians/:technicianId` | **MISSING** | No registered detail route/controller. |
| `GET /api/v1/admin/technicians/statistics` | **MISSING** | No registered aggregate statistics route/controller. |

Recommended implementation based on existing patterns: add admin-only routes/controllers, query `Technician`, populate `userId` with safe fields (`name email role`) and `services`, support `verificationStatus` filter with only the schema enum values, and use bounded page/limit pagination. The detail route should validate Mongo ObjectId and return 404 for absent profiles. Statistics should aggregate counts grouped by `verificationStatus` and return explicit zeroes for all three values. These are recommendations, not existing behavior.

## 4. Area APIs

All listed area APIs require a token and lowercase `admin` role. JSON bodies are supported because `index.js` calls `express.json()`.

### Create request bodies

Common required fields: `name`, `division`, `district`, `type`. `slug` is optional; the controller generates it from `slug || name` using an English lowercase slug helper. Optional fields: `nameBn`, `upazila`, `cityCorporation`, `areaSqKm`, `boundary`. Zone requires integer-like `zoneNo` and must omit/null `parentAreaId`. Ward requires integer-like `wardNo` and a `parentAreaId` referring to an active Zone. Neighbourhood requires `parentAreaId` referring to an active Ward. Parent must be an active document of the expected type. `zoneNo` for Ward is inherited from parent; Neighbourhood creation sets zoneNo from its Ward parent (which may be null in the current controller) and sets `wardNo: null`.

Example Zone body:

```json
{ "name": "Dhaka North Zone 1", "nameBn": "ঢাকা উত্তর জোন ১", "type": "Zone", "division": "Dhaka", "district": "Dhaka", "cityCorporation": "DNCC", "zoneNo": 1, "areaSqKm": 12.5 }
```

Example Ward body (replace parent id with a real Zone ObjectId):

```json
{ "name": "Ward 1", "type": "Ward", "parentAreaId": "66a000000000000000000001", "division": "Dhaka", "district": "Dhaka", "cityCorporation": "DNCC", "wardNo": 1 }
```

Example Neighbourhood body (parent is a Ward ObjectId):

```json
{ "name": "Mirpur Section 1", "type": "Neighbourhood", "parentAreaId": "66a000000000000000000002", "division": "Dhaka", "district": "Dhaka", "cityCorporation": "DNCC", "upazila": "" }
```

Optional boundary example (closed ring):

```json
{ "type": "Polygon", "coordinates": [[[90.40, 23.80], [90.41, 23.80], [90.41, 23.81], [90.40, 23.80]]] }
```

Create response is `201`: `{ "success": true, "message": "Zone created successfully.", "data": <created Area> }` (message changes with type). Errors include 400 required/type/parent/number/boundary/slug validation; 404 invalid/missing/inactive parent; 409 duplicate slug; 500 unexpected error.

### Area route reference

| Method and URL | Query/body | Successful response shape and behavior |
|---|---|---|
| `POST /api/v1/admin/area/create` | JSON create body above | `201 {success,message,data: area}` |
| `GET /api/v1/admin/area/all_areas` | Query: `search`, `division`, `district`, `upazila`, `type`, `parentAreaId`, `zoneNo`, `wardNo`, `isActive`, `includeBoundary` (default false), `page` (1), `limit` (10; max 100) | `{success,message,total,pagination:{currentPage,limit,totalPages},filters:{type,zoneNo,wardNo},data:[areas]}`. Parent and createdBy are populated. Boundary excluded by default. |
| `GET /api/v1/admin/area/selected_area/:areaId` | Query `includeBoundary` default true | `{success,message,data:{...area,children:[active child areas]}}`; parent and createdBy populated. |
| `PATCH /api/v1/admin/area/update_areas/:areaId` | JSON partial body: `name`, `nameBn`, `slug`, `division`, `district`, `upazila`, `cityCorporation`, `areaSqKm`, `boundary`, `isActive`. `type` and `parentAreaId` are rejected. | `{success,message,data: updatedArea}` |
| `PATCH /api/v1/admin/area/:areaId/status` | `{ "isActive": true }` or false | `{success,message,data: area}`. Parent must be active to activate; active children must be deactivated first to deactivate. |
| `DELETE /api/v1/admin/area/:areaId` | No body | Soft-deactivates (does not delete); rejects if any child exists or already inactive. `{success,message,data: area}` |
| `POST /api/v1/admin/area/find-by-location` | `{ "lat": 23.8, "lng": 90.4 }` | `{success,message,coordinates:{lat,lng},totalMatches,data:[{neighbourhood,ward,zone}]}`; matches active Ward and Neighbourhood polygons. |
| `GET /api/v1/admin/area/zones` | NOT REGISTERED (leaf router is not mounted). Use `/api/v1/admin/area/all_areas?type=Zone`. |
| `GET /api/v1/admin/area/zones/:zoneId/wards` | Query `includeBoundary` default false | `{success,message,zone:{_id,name,zoneNo,cityCorporation},total,data:[wards]}`; only active zone/wards. |
| `GET /api/v1/admin/area/hierarchy` | Query `cityCorporation`, `division`, `district`, `isActive=true|false` | `{totalZones,totalAreas,data:[zones with nested children]}`; excludes boundaries. |
| `GET /api/v1/admin/area/:areaId/children` | No query/body | `{success,message,parent:{_id,name,type},childType,total,data:[children]}`; active children only. Neighbourhood returns 400. |

Update example:

```json
{ "name": "Updated Ward Name", "nameBn": "নতুন নাম", "areaSqKm": 2.4, "isActive": true }
```

Status example:

```json
{ "isActive": false }
```

Common area error shapes: 400 `{success:false,message:"..."}`, 404 `{success:false,message:"..."}`, 409 duplicate slug, and 500 `{success:false,message:"...",error:"..."}`. Individual messages vary as specified by controller. `DELETE` is a soft deactivate; the success message is `Area deactivated successfully`.

## 5. Service APIs

### Create service (admin)

`POST /api/v1/admin/services/createService`, token + lowercase admin. JSON body fields read by controller:

```json
{ "name": "Oil Change", "description": "Engine oil replacement", "icon": "oil-change" }
```

Only `name` is required. `description` and `icon` default to empty strings; `isActive` is model-defaulted true but not read from request by this controller. Success is HTTP 201 and returns the created document:

```json
{ "success": true, "message": "Service created successfully", "data": { "_id": "66a000000000000000000010", "name": "Oil Change", "description": "Engine oil replacement", "icon": "oil-change", "isActive": true } }
```

Missing name currently returns 409 (not 400); duplicate exact name returns 409; unexpected failure returns 500 `{success:false,message:"Internal server error",error:"..."}`.

### Get all services (authenticated, no role-specific check)

`GET /api/v1/allservice/getallService` requires a valid token; it is not under `/admin` and has no admin-only middleware. It takes no query parameters/body. Success:

```json
{ "success": true, "message": "Services fetched successfully", "services": [{ "_id": "66a000000000000000000010", "name": "Oil Change", "description": "Engine oil replacement", "icon": "oil-change", "isActive": true }] }
```

Failure: 500 `{success:false,message:"Internal server error",error:"..."}`.

## 6. Review APIs

### Existing routes

| Method and URL | Authorization | Request / response |
|---|---|---|
| `GET /api/v1/pump/:pumpId/reviews` | Token + role `Rider` or lowercase `admin`; hidden reviews excluded | Query `page` default 1, `limit` default 10, max 50. Success `{success,message,data:{reviews:[...populated user name],pagination:{page,limit,total,totalPages}}}`. Invalid pump id 400; pump not approved/active or absent 404; unexpected 500. |
| `POST /api/v1/pump/:pumpId/review` | Token required; no explicit role guard; pump owner cannot review own pump | JSON `{ "rating": 5, "comment": "Good service" }`; rating integer 1–5, comment optional max 500. Upserts one review per user/pump. Success `{success,message,data:{review,avgRating,reviewCount}}`. |
| `DELETE /api/v1/pump/:pumpId/review` | Token required; deletes only current user's review | No body. Success `{success,message,data:{pump,avgRating,reviewCount}}`. |
| `PATCH /api/v1/admin/review/:id/hide` | Admin route also enforces lowercase admin globally; leaf middleware additionally permits Rider/admin, so admin passes | No body. Toggles `isHidden` each call; success message says hidden or unhidden and returns `{success,message,data:{review,avgRating,reviewCount}}`. |

POST review errors: 400 invalid ID/rating/comment or validation; 403 pump owner; 404 pump missing; 409 non-approved/inactive pump; 409 duplicate key race; 500 unexpected. GET review uses 400/404/500. DELETE uses 400/404/500. Hide uses 400/404/500. Public query uses only approved, active pumps and only visible reviews.

### Requested admin list route

`GET /api/v1/admin/review` is **MISSING**. Recommended controller: paginated `Review.find()` sorted newest first; populate `user` selecting `name email`, populate `pump` selecting `name`, optionally filter visibility/rating/pump/user; return review `_id`, reviewer, pump name, rating, comment, `createdAt`, `isHidden`, and `{page,limit,total,totalPages}`. This is a recommendation only; none of those filters or response keys exist as an admin list API today.

## 7. Authentication

### Admin login

`POST /api/v1/auth/login` body:

```json
{ "email": "admin@example.com", "password": "<admin password>" }
```

Successful response is 200:

```json
{ "success": true, "message": "Login successful", "data": { "user": { "id": "66a000000000000000000020", "name": "Dashboard Admin", "email": "admin@example.com", "role": "admin" }, "accessToken": "<JWT omitted>", "technicianProfile": false } }
```

JWT is signed with `JWT_ACCESS_SECRET`; `helpers/utils.js` sets `expiresIn: "1d"` (one day). Payload includes `id`, `email`, `role`. Login also sets `accessToken` as an HTTP-only cookie; HTTPS requests set `secure: true`, `sameSite: "none"`; HTTP uses `secure: false`, `sameSite: "lax"`.

For React/Postman, send `Authorization: Bearer <accessToken>` on protected requests. Cookie authentication is also supported; browser cross-origin cookie requests need credentials enabled. The app CORS allowlist currently contains localhost:5173 and the deployed Netlify frontend origin.

Role capitalization is significant: admin role is lowercase `admin`. Technician is capitalized `Technician`. `User` schema allows lowercase `admin`, not `Admin`.

**Security findings from current source:** `POST /api/v1/auth/registration` is public, requires a `role`, and passes that caller-supplied role into `User.create`; the User schema accepts `admin`. The handler therefore appears to allow callers to register admin accounts. It also serializes the newly created User document in its response; since the schema does not mark `password` as `select: false` or remove it before response, the response appears to include the password hash. These are source-inspection findings, not verified against the running database. Registration body fields are `name`, `email`, `password`, `role`. Restrict public roles, provision admins through a trusted process, and exclude password from registration responses.

Auth failure behavior:

- `protect`: missing token -> 401 `{success:false,message:"Unauthorized request"}`; invalid/expired token or no matching user -> 401 (invalid/expired message for caught verification errors).
- `adminpass`: authenticated non-admin -> 403 `{success:false,message:"Access denied. Admin only."}`.
- Login missing email/password -> 400 with `message` as a field-error object. Invalid credentials -> 401 `{success:false,message:"Invalid email or password"}`.
- Logout: `POST /api/v1/auth/logout`, clears the cookie and returns 200; it has no `protect` middleware and does not revoke already-issued JWTs.

## 8. Postman examples

Set collection variable `baseUrl` to `http://localhost:8000/api/v1`. For protected endpoints set Authorization type **Bearer Token** with the login `data.accessToken`; use `Content-Type: application/json` for JSON bodies. Do not store a real production token in a shared collection.

### Auth and service requests

| Method + URL | Auth | Body |
|---|---|---|
| `POST {{baseUrl}}/auth/login` | None | `{ "email": "admin@example.com", "password": "<password>" }` |
| `POST {{baseUrl}}/auth/logout` | None (cookie cleared if supplied) | none |
| `POST {{baseUrl}}/admin/services/createService` | Admin Bearer | `{ "name": "Oil Change", "description": "Engine oil replacement", "icon": "oil-change" }` |
| `GET {{baseUrl}}/allservice/getallService` | Bearer | none |

### Technician approval requests

| Method + URL | Auth | Body |
|---|---|---|
| `PATCH {{baseUrl}}/admin/pending_technician/{{technicianId}}/approve` | Admin Bearer | none |
| `PATCH {{baseUrl}}/admin/pending_technician/{{technicianId}}` | Admin Bearer | none; same approval behavior |
| `PATCH {{baseUrl}}/admin/pending_technician/{{technicianId}}/reject` | Admin Bearer | none |

Example success for approval/rejection is the `technician` response in Section 3. These routes mutate records but there is no admin GET technician list/details endpoint to source IDs from.

### Area requests

All require Admin Bearer. Append query parameters as shown in Section 4. Representative Postman bodies:

| Method + URL | Body |
|---|---|
| `POST {{baseUrl}}/admin/area/create` | Use the Zone/Ward/Neighbourhood JSON examples in Section 4 |
| `PATCH {{baseUrl}}/admin/area/update_areas/{{areaId}}` | `{ "name": "Updated Ward Name", "nameBn": "নতুন নাম", "areaSqKm": 2.4 }` |
| `PATCH {{baseUrl}}/admin/area/{{areaId}}/status` | `{ "isActive": false }` |
| `POST {{baseUrl}}/admin/area/find-by-location` | `{ "lat": 23.8, "lng": 90.4 }` |
| `GET {{baseUrl}}/admin/area/all_areas?type=Ward&isActive=true&page=1&limit=10` | none |
| `GET {{baseUrl}}/admin/area/selected_area/{{areaId}}?includeBoundary=false` | none |
| `DELETE {{baseUrl}}/admin/area/{{areaId}}` | none; soft-deactivates |
| `GET {{baseUrl}}/admin/area/zones?isActive=true` | Not runnable: route is not registered; use `/admin/area/all_areas?type=Zone` |
| `GET {{baseUrl}}/admin/area/zones/{{zoneId}}/wards?includeBoundary=false` | none |
| `GET {{baseUrl}}/admin/area/hierarchy?division=Dhaka&isActive=true` | none |
| `GET {{baseUrl}}/admin/area/{{areaId}}/children` | none |

Successful response keys and common errors are listed in Section 4; all Area error responses use JSON. Example create success: `{ "success": true, "message": "Zone created successfully.", "data": { "_id": "...", "name": "Dhaka North Zone 1", "type": "Zone", "parentAreaId": null, "isActive": true } }`.

### Pump, review, and role admin requests

| Method + URL | Auth | Body/query |
|---|---|---|
| `GET {{baseUrl}}/admin/pump/all_pumps?approvalStatus=pending&page=1&limit=10` | Admin Bearer | Optional `approvalStatus` pending/approved/rejected, `search`, `page`, `limit` |
| `GET {{baseUrl}}/admin/pump/selected_pump/{{pumpId}}` | Admin Bearer | none |
| `PATCH {{baseUrl}}/admin/pump/approve/{{pumpId}}` | Admin Bearer | none |
| `PATCH {{baseUrl}}/admin/pump/reject/{{pumpId}}` | Admin Bearer | `{ "reason": "Incomplete pump information" }` |
| `PATCH {{baseUrl}}/admin/review/{{reviewId}}/hide` | Admin Bearer | none; toggles hidden state |
| `GET {{baseUrl}}/admin/role/search?email=user@example.com` | Admin Bearer | none |
| `PATCH {{baseUrl}}/admin/role/update/{{userId}}` | Admin Bearer | `{ "role": "Technician", "reason": "Verified technician profile" }` |
| `GET {{baseUrl}}/admin/role/history/{{userId}}?page=1&limit=10` | Admin Bearer | none |

Pump list success: `{ "success": true, "message": "Pumps retrieved successfully.", "data": { "pumps": [], "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 } } }`. Pump rejection requires non-empty reason. Role update allowed values are `User`, `Rider`, `Technician`, `PumpOwner` (admin cannot be assigned via this endpoint). Role search requires `email`. Role update uses a Mongo transaction, so MongoDB must support transactions (normally a replica set or sharded deployment).

### Public/user APIs relevant to the dashboard

`GET /api/v1/pump/:pumpId/reviews` needs a Rider or admin token and optional `page`, `limit`; `POST /api/v1/pump/:pumpId/review` needs a token and body `{ "rating": 5, "comment": "Good service" }`; `DELETE /api/v1/pump/:pumpId/review` needs a token. They return the shapes in Section 6. Note that GET review endpoint is not available to Technician by current middleware.

Other registered non-admin endpoints, for completeness of the route surface: `GET /api/v1/area/list`, `GET /api/v1/pump/by_area`, `GET /api/v1/pump/:id`, technician profile/request/status endpoints, rider request endpoints, and pump-owner create/list/update/status/fuel/review endpoints. They are not Admin dashboard APIs; exact leaf routes are in `routes/publicRoutes`, `routes/tecnicianRoutes`, `routes/requestRoutes`, and `routes/pumpAdmin`.

## 9. Tested APIs

- **Source route registration: inspected.** The paths documented here are composed from the current route files and the `/api/v1` value in `.env`.
- **Runtime server: NOT VERIFIED.** `npm start` was attempted but did not emit a MongoDB-connected/server-listening message before the process was stopped. Local HTTP probing therefore could not establish a live API response.
- **Public endpoint calls: NOT TESTED.** Server readiness was not established.
- **Authenticated/admin endpoint calls: NOT TESTED.** No test with an existing Admin JWT was performed.
- **MongoDB Technician records/status values: NOT TESTED.** No live database query was performed; documented statuses come from the schema/controller source.

## 10. Missing APIs

| API | Status | Dashboard impact |
|---|---|---|
| `GET /api/v1/admin/technicians` | MISSING | Cannot browse/filter/paginate technician profiles via Admin API |
| `GET /api/v1/admin/technicians/:technicianId` | MISSING | Cannot fetch one profile via Admin API |
| `GET /api/v1/admin/technicians/statistics` | MISSING | No pending/approved/rejected counts |
| `GET /api/v1/admin/review` | MISSING | No admin review table or server-side pagination |
| Dashboard summary endpoint | MISSING | No single API for aggregate cards/counts across users, technicians, pumps, areas, reviews |

## 11. Recommended backend changes

1. Add the three admin Technician read APIs. Include safe populated User fields, status filters, pagination, and status-grouped counts; validate IDs and return consistent error shapes.
2. Add `GET /api/v1/admin/review` with populated reviewer/pump summaries and pagination. Keep visibility/status filters explicit.
3. Add an admin dashboard summary endpoint if the frontend needs aggregate cards without making several collection requests.
4. Consider giving the `PATCH /pending_technician/:technicianId` approval alias a deprecation plan; it is currently identical to `/approve` and has no body.
5. Review the admin role guard in `userRoleController.js`: its protected-target check compares role to `"Admin"`, while the User schema and admin middleware use lowercase `"admin"`. The assignment allowlist excludes admin, but the case mismatch is still present in source.
6. Consider aligning the review read middleware with product policy: currently Riders/admin can read reviews, while any authenticated role can submit/delete their own review (subject to pump-owner and pump-state checks).
7. Restrict public registration so callers cannot choose `admin`; public signup should only accept the intended self-service roles. Provision admin users through a trusted seed/invite process.

## Frontend integration summary

**Available now from source:** admin technician approve/reject by known Technician ID; Area CRUD-like operations (delete is soft deactivation); service creation; pump list/detail/approve/reject; review hide/unhide; user role search/update/history. Authenticated service listing and pump review endpoints are also present.

**Needs backend implementation for a typical Admin dashboard:** technician list/detail/statistics, admin review list/pagination, and any combined dashboard statistics endpoint. Runtime behavior still needs verification against a connected MongoDB and an Admin token.
