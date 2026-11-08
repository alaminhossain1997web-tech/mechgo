# PothSeba Backend Complete Audit

**Audit basis:** source inspection of the checked-out workspace. Examples in this report are illustrative contracts based on controller code, not records returned by a live API. No backend source was edited.

## 1. Project structure and startup

### Runtime

- Entry point: `index.js`; npm command: `npm start` → `node index.js`.
- Express 5 app, `express.json()`, cookie parser, CORS credentials, HTTP server, Socket.IO.
- `config/env.js` loads `.env` and provides `requiredEnv(name)`.
- Mongo connection: `config/dbConfig.js` calls `mongoose.connect(requiredEnv("DB_URL"))`.
- HTTP server listens on `PORT` (configured `.env` value is 8000; code fallback is 8000), host `0.0.0.0`, only after Mongo connects. API prefix configured in `.env`: `/api/v1`.
- Top-level files include `README.md`, `PUMP_ADMIN_FRONTEND_REPORT.md`, `export.geojson`, `new-areas.txt`, `package.json`, and `package-lock.json`. `postman/` contains partial request/environment YAML. `seeds/`, `scripts/`, and `tests/` are operational/support code, not API routers.
- No React frontend source is present in the inspected workspace, so exact frontend component/RTK Query mismatches cannot be established from source here.

### Environment variable names found in source

`BASE_URL`, `PORT`, `DB_URL`, `JWT_ACCESS_SECRET`, `MAPBOX_ACCESS_TOKEN`, `NODE_ENV`, `FRONTEND_URL`, and `SEED_ADMIN_ID`. Secret values and database URLs are intentionally omitted. `BASE_URL` and `PORT` are loaded from the checked-out `.env`; map integration uses Mapbox reverse geocoding. `SEED_ADMIN_ID` is used by seed scripts.

### Route registration flow

`index.js` loads `routes/index.js`, then mounts the returned router with `app.use(router)`. `routes/index.js` mounts auth and protected public routes at `BASE_URL`, then attaches `protect` to technician, service, request, pump-owner, and admin routers. The admin router adds `/admin` and `adminpass`, then mounts service, technician decision, area, pump, review, and role routers. Public review/area/pump endpoints add their own `protect` and role middleware.

`/` is a root health route returning `{success:true,message:"PothSeba Backend is running"}`. Socket.IO is initialized before database connection and HTTP listen.

### Folder/file inventory

| Folder | Contents |
|---|---|
| `config/` | `env.js`, `dbConfig.js`, `socket.js` |
| `models/` | 8 Mongoose models (Section 2) |
| `controllers/authController/` | registration, login, logout |
| `controllers/adminContoller/` | area, pending technician, pump, review, role, service controllers |
| `controllers/publicController/` | area/pump/review reads |
| `controllers/PumpAdmin/` | pump-owner operations and review create/delete |
| `controllers/requestController/` | request create/search/list/status/location |
| `controllers/tecnicianController/` | profile, technician requests/status and two unmounted availability controllers |
| `routes/` | API route files and aggregators; exact route inventory in Section 4 |
| `middlewares/` | `protect`, `adminpass`, `allowRiderOrAdmin`, `allowTechnicianOrAdmin` |
| `helpers/` | slug, area boundary, pump area/name, reverse geocoding, JWT, rating, utility helpers |
| `postman/` | existing partial Postman YAML; not a complete generated collection |
| `seeds/`, `scripts/`, `tests/` | data setup/conversion, one-off scripts, Node tests |

### Integrations, uploads and Socket.IO

- MongoDB via Mongoose; JWT via `jsonwebtoken`; password hashing via `bcrypt`; Mapbox Search Geocoding v6 reverse endpoint via `fetch` and `MAPBOX_ACCESS_TOKEN`.
- No file upload middleware/storage configuration or upload route is present in the inspected source.
- Socket.IO path `/socket.io/`; CORS origins include localhost:5173, the Netlify frontend, and comma-separated `FRONTEND_URL` values. Socket handshake takes `auth.token`, verifies the same JWT secret, loads only Rider/Technician accounts, and joins `rider:<userId>` or `technician:<technicianId>` rooms.
- Events: `request:new` to technician when a rider creates a request; `request:updated` to rider and technician on valid status changes; `technician:location:update` inbound; `technician:location` to rider; failures emit `technician:location:error`. Location writes are limited to one per 3 seconds and allowed only for the assigned technician while request status is accepted/on_the_way/in_progress. Coordinates are `[longitude, latitude]`.

## 2. Mongoose model audit

All models use CommonJS. No model virtuals or post hooks were found. Collection names below are Mongoose default pluralizations where source does not explicitly configure a collection.

### User — `models/authSchema/userSchema.js`

Model `User`, default collection `users`; timestamps enabled.

| Field | Type / validation |
|---|---|
| `name` | String, required, trimmed |
| `email` | String, required, unique, trimmed, lowercase |
| `password` | String, required |
| `role` | String, required; enum `User`, `Rider`, `Technician`, `PumpOwner`, `admin`; default `User` |
| `createdAt`, `updatedAt` | Mongoose timestamps |

Pre-save hook hashes password with bcrypt (10 salt rounds) only when `password` is modified. No password select exclusion or JSON transform is configured. Registration currently returns the raw created document; by source inspection, that can include the bcrypt hash.

### Technician — `models/tecnicianSchema/tecnicianSchema.js`

Model `Technician`, default collection `technicians`; no timestamps option.

| Field | Type / validation |
|---|---|
| `userId` | ObjectId ref `User`, required |
| `shopname` | String, required |
| `phone` | String, required |
| `services` | ObjectId array ref `services` |
| `location.type` | String enum `Point`, default `Point` |
| `location.coordinates` | Number array, required; controller validates exactly two values and ranges on profile create; GeoJSON `[lng,lat]` |
| `isOnline` | Boolean default false |
| `isAvailable` | Boolean default false |
| `verificationStatus` | enum `pending`, `approved`, `rejected`; default `pending` |

Index: `location: "2dsphere"`. Relationship: `Technician.userId → User._id`; it is one profile lookup by controller, but schema has no unique constraint, so DB does not enforce one-to-one. Services reference model `services`. Approval/rejection changes this document; rejected rows are retained.

### Pump — `models/pumpSchema/pumpSchema.js`

Model `Pump`, default collection `pumps`; timestamps enabled, `versionKey:false`.

| Field | Type / defaults / validation |
|---|---|
| `name` | String required, trimmed, max 150 |
| `slug` | String required, unique, lowercase, trimmed |
| `description` | String default `""`, trimmed, max 1000 |
| `phone` | String default `""`, trimmed |
| `email` | String default `""`, lowercase, trimmed |
| `address` | String required, trimmed |
| `division`, `district` | Strings required, trimmed |
| `locationName` | String default `""`, trimmed |
| `areaIds` | required nonempty array of ObjectId refs `Area` |
| `location.type` | String enum `Point`, required, default `Point` |
| `location.coordinates` | required `[longitude,latitude]`; exactly two finite numbers and range-checked |
| `fuels` | array of nested `{type,price,available}`; type enum `Petrol`, `Octane`, `Diesel`, `CNG`, `LPG`, `EV`; price required min 0; available default true |
| `fuelsUpdatedAt` | Date default null |
| `approvedBy` | ObjectId ref `User`, default null |
| `approvedAt` | Date default null |
| `rejectionReason` | String default `""`, trimmed |
| `approvalStatus` | enum `pending`, `approved`, `rejected`; default `pending` |
| `avgRating` | Number default 0, min 0, max 5 |
| `reviewCount` | Number default 0, min 0 |
| `facilities` | String array enum `Restroom`, `Prayer Room`, `Restaurant`, `Car Wash`, `Air Pump`, `ATM`, `Convenience Store`, `EV Charging`; default [] |
| `isOpen` | Boolean default false; owner availability |
| `isActive` | Boolean default true; admin activation |
| `createdBy` | required ObjectId ref `User` |
| `createdAt`, `updatedAt` | Mongoose timestamps |

Indexes: 2dsphere location; text name/address; areaIds; createdBy; compound `(isOpen,isActive,approvalStatus)`; compound `(areaIds,approvalStatus,isActive)`. Rating counters are denormalized and refreshed by review create/delete/hide operations.

### Area — `models/Area/areaSchema.js`

Model `Area`, default collection `areas`; timestamps enabled.

| Field | Type / defaults / validation |
|---|---|
| `name` | String required, trimmed |
| `nameBn` | String default `""`, trimmed |
| `slug` | String required, lowercase, trimmed |
| `type` | required enum `Zone`, `Ward`, `Neighbourhood`; indexed |
| `parentAreaId` | ObjectId ref `Area`, default null; indexed |
| `division`, `district` | required trimmed strings |
| `upazila`, `cityCorporation` | trimmed strings default `""` |
| `zoneNo`, `wardNo` | Number default null |
| `areaSqKm` | Number default null, min 0 |
| `boundary.type` | enum `Polygon`, `MultiPolygon` |
| `boundary.coordinates` | `Mixed` |
| `isActive` | Boolean default true |
| `createdBy` | ObjectId ref User |
| timestamps | `createdAt`, `updatedAt` |

Hierarchy hook: Zone cannot have parent; Ward/Neighbourhood must have one. If boundary exists, both type and coordinates must be present. Create controller enforces Ward→Zone and Neighbourhood→Ward, active parent, plus polygon validation helper (positions bounded to longitude/latitude, closed rings length ≥4). Indexes: unique `(type,parentAreaId,slug)`, 2dsphere boundary. Area-to-Pump is through Pump.areaIds array of Area refs, not reverse ref.

### Service — `models/serviceSchema/serviceSchema.js`

Model name `services`, default collection `services`; timestamps disabled.

| Field | Type / defaults |
|---|---|
| `name` | String required, unique, trimmed |
| `description` | String default `""`, trimmed |
| `icon` | String default `""`, trimmed |
| `isActive` | Boolean default true |

No category/type field or category relationship exists in this schema. Technician.services and DriverRequest.serviceId reference this model.

### Review — `models/Review/reviewSchema.js`

Model `Review`, default collection `reviews`; timestamps enabled.

| Field | Type / validation |
|---|---|
| `pump` | required ObjectId ref Pump |
| `user` | required ObjectId ref User |
| `rating` | required integer Number min 1/max 5 |
| `comment` | optional trimmed String max 500 |
| `isHidden` | Boolean default false |
| timestamps | createdAt/updatedAt |

Indexes: unique `(pump,user)`; `(pump,isHidden,createdAt desc)`. One review per user and pump.

### Request — `models/requestSchema/driverRequestSchema.js`

Model `driverRequest` (Mongoose default collection `driverrequests`); timestamps enabled.

| Field | Type / validation |
|---|---|
| `userId` | required ObjectId ref User |
| `technicianId` | required ObjectId ref Technician |
| `serviceId` | required ObjectId ref `services` |
| `location` | GeoJSON Point default type `Point`; coordinates required, exactly two finite bounded numbers `[lng,lat]` |
| `description` | required trimmed String max 1000 |
| `status` | enum `pending`, `accepted`, `rejected`, `on_the_way`, `in_progress`, `completed`, `cancelled`; default pending |
| `liveLocation.coordinates` | optional Number array; exactly 2 bounded finite numbers when present |
| `liveLocation.updatedAt` | Date |
| timestamps | createdAt/updatedAt |

Indexes: `(technicianId,status)` and `(userId,createdAt desc)`. No GeoJSON index is declared on request location/liveLocation.

### RoleHistory — `models/RoleHistory/roleHistorySchema.js`

Model `RoleHistory`, default collection `rolehistories`; timestamps enabled.

| Field | Type / validation |
|---|---|
| `userId` | required ObjectId ref User, indexed |
| `previousRole`, `newRole` | required String (no enum) |
| `changedBy` | required ObjectId ref User |
| `reason` | optional trimmed String max 300 |
| `ipAddress`, `userAgent` | String |
| timestamps | createdAt/updatedAt |

No additional unique constraint or hooks.

## 3. Middleware and security

- `protect`: accepts `req.cookies.accessToken` or second token of `Authorization` split on spaces; verifies JWT using required `JWT_ACCESS_SECRET`; loads User by decoded.id. Missing token returns 401 `Unauthorized request`; invalid/expired token returns 401 `Invalid or expired token`; no matching user returns 401.
- `adminpass`: requires lowercase role `admin`, else 403 `Access denied. Admin only.`
- `allowRiderOrAdmin`: only `Rider` or lowercase `admin`; `allowTechnicianOrAdmin`: only `Technician` or lowercase `admin`.
- Login creates JWT with payload `{id,email,role}`, expires in one day. It returns accessToken JSON and sets an HTTP-only cookie. Frontend may send Bearer token; browser cookie calls must use credentials and allowed CORS origin.
- Cookie option mismatch: login derives secure/sameSite from request HTTPS/proxy state; logout derives them from NODE_ENV. If those disagree, the cookie may not be cleared with matching attributes. Logout also does not revoke JWTs already copied by the frontend.
- Password hashing: User `pre("save")` bcrypt hook; direct update methods on User would not invoke this hook, but current role update does not modify password.
- CORS in HTTP app allows `http://localhost:5173` and `https://pothseba.netlify.app`, credentials true. Socket allows those plus `FRONTEND_URL` comma-list. No upload handling found.
- **Critical source-level issue:** public registration takes a caller-supplied role; schema permits `admin`, so the route appears to permit self-registration as admin. It returns the created User document without excluding password, which appears to expose password hash. No live exploit test was performed.
- In role update, the controller checks target role against uppercase `"Admin"`, but schema/admin middleware use lowercase `"admin"`. Allowed roles exclude admin, yet this is a case mismatch.
- Admin review hide route has local `protect, allowRiderOrAdmin` middleware, but is mounted inside `/admin` behind `protect, adminpass`; therefore effective access is admin only.

## 4. Registered API inventory

The following are registered endpoints only. `BASE_URL` is `/api/v1`. `Bearer` means global `protect` or local `protect`; role checks are additional. This inventory has **46 distinct method/path routes**, counting the approval alias as its own route. There are **22 admin routes**. Unmounted route definitions are in Section 5.

| # | Method + URL | Route file → handler | Middleware / DB summary |
|---:|---|---|---|
| 1 | GET `/` | `index.js` → inline health | Public; no DB query |
| 2 | POST `/api/v1/auth/registration` | `routes/authRouts/registration.js` → `registrationController` | Public; User.findOne then User.create |
| 3 | POST `/api/v1/auth/login` | `routes/authRouts/login.js` → `loginController` | Public; User.findOne, bcrypt compare, optional Technician.findOne, JWT/cookie |
| 4 | POST `/api/v1/auth/logout` | `routes/authRouts/logout.js` → `logoutController` | Public; clear cookie only |
| 5 | GET `/api/v1/area/list` | `routes/publicRoutes/index.js` → `getActiveAreasController` | protect→Rider/admin; Area.find active, select name/slug/division/district/upazila, sort name |
| 6 | GET `/api/v1/pump/by_area` | same → `getPublicPumpsController.getByArea` | protect→Rider/admin; approved/active pump filter, area/fuel, paginated sort |
| 7 | GET `/api/v1/pump/:pumpId/reviews` | same → `getPumpReviewsController` | protect→Rider/admin; approved active Pump; visible Review.find/count, populate user name, newest first |
| 8 | GET `/api/v1/pump/:id` | `routes/index.js` → `getPublicPumpsController.getOne` | protect→Technician/admin; approved active Pump, safe public fields |
| 9 | POST `/api/v1/create-profile/tecnicianprofile` | `routes/tecnicianRoutes/createProfile.js` → `tecnicianController` | global protect; create Technician linked to req.user; reverse geocode |
| 10 | GET `/api/v1/request/getrequest` | `routes/tecnicianRoutes/getRequest.js` → `getTechnicianRequestsController` | global protect + controller Technician check; query by Technician, populate user/service, newest first |
| 11 | PATCH `/api/v1/technician/status` | `routes/tecnicianRoutes/tecnichianStatus.js` → `updateTechnicianStatus` | global protect; updates approved profile by userId |
| 12 | GET `/api/v1/allservice/getallService` | `routes/serviceRoutes/getAllService.js` → `getAllServiceController` | global protect; Service.find all |
| 13 | GET `/api/v1/request/findTechnician` | `routes/requestRoutes/FindTechnician.js` → `findTechnicianController` | global protect; 5km geoNear approved/online/available, lookup service, distance sort |
| 14 | POST `/api/v1/request/createRequest` | `routes/requestRoutes/sendRequest.js` → `createRequestController` | global protect + Rider check; validate Technician/Service; create request; emit Socket event |
| 15 | PATCH `/api/v1/request/:requestId/status` | same → `updateRequestStatusController` | global protect; Rider/Technician ownership and transition checks; atomic status update/populates; emits |
| 16 | GET `/api/v1/request/my-requests` | same → `getRiderRequestsController` | global protect + Rider; current user requests, populate tech/service, newest first |
| 17 | GET `/api/v1/request/:requestId/location` | same → `getRequestLocationController` | global protect + Rider/Technician; owner-scoped lookup and tracking-state check |
| 18 | POST `/api/v1/pump/create` | `routes/pumpAdmin/createPump.js` → `createPumpController` | global protect; create owner pump, spatial Area lookup, reverse geocode; pending approval |
| 19 | GET `/api/v1/pump/my_pumps` | `routes/pumpAdmin/getmyPump.js` → `getMyPumpsController` | global protect; owner-filtered list, area populate, search/status/open/active filters, pagination + owner summary |
| 20 | PATCH `/api/v1/pump/my_pumps/:pumpId/update` | `routes/pumpAdmin/updateMypump.js` → `updateMyPumpController` | global protect; owner-scoped update; sensitive changes reset approval |
| 21 | PATCH `/api/v1/pump/my_pumps/:pumpId/status` | `routes/pumpAdmin/updatePumpStatus.js` → `updatePumpStatusController` | global protect; owner-scoped open/close; only approved active may open |
| 22 | PATCH `/api/v1/pump/my_pumps/:pumpId/fuels` | `routes/pumpAdmin/updatePumpFuels.js` → `updatePumpFuelsController` | global protect; owner-scoped, approved pump only; updates fuels/date |
| 23 | POST `/api/v1/pump/:pumpId/review` | `routes/pumpAdmin/pumpReview.js` → `upsertPumpReviewController` | global protect; upsert Review by pump/user, recalc Pump rating |
| 24 | DELETE `/api/v1/pump/:pumpId/review` | same → `deletePumpReviewController` | global protect; delete own review, recalc Pump |
| 25 | POST `/api/v1/admin/services/createService` | `routes/adminRoutes/services/createService.js` → `createserviceController` | protect→adminpass; Service.findOne/create |
| 26 | PATCH `/api/v1/admin/pending_technician/:technicianId/approve` | `routes/adminRoutes/pending_request/approved_request.js` → `approveTechnician` | protect→adminpass; Technician.findByIdAndUpdate approved/offline/unavailable |
| 27 | PATCH `/api/v1/admin/pending_technician/:technicianId` | same → same | Same approval alias/query |
| 28 | PATCH `/api/v1/admin/pending_technician/:technicianId/reject` | `routes/adminRoutes/pending_request/cancel_request.js` → `rejectTechnician` | protect→adminpass; update rejected/offline/unavailable |
| 29 | POST `/api/v1/admin/area/create` | `routes/adminRoutes/Area_route/createArea.js` → `createArea` | protect→adminpass; validate hierarchy/boundary/slug; Area.create |
| 30 | GET `/api/v1/admin/area/all_areas` | `.../getAllArea.js` → `getAllAreas` | protect→adminpass; filter/search, populate parent/user, sort, paginate |
| 31 | PATCH `/api/v1/admin/area/update_areas/:areaId` | `.../updateArea.js` → `updateArea` | protect→adminpass; load/save one area; cannot change type/parent |
| 32 | GET `/api/v1/admin/area/selected_area/:areaId` | `.../getsinglearea.js` → `getSingleArea` | protect→adminpass; populate parent/user, active children query |
| 33 | PATCH `/api/v1/admin/area/:areaId/status` | `.../updateAreaStatus.js` → `updateAreaStatus` | protect→adminpass; parent/child activation constraints, save |
| 34 | POST `/api/v1/admin/area/find-by-location` | `.../findAreaByLocation.js` → `findAreaByLocation` | protect→adminpass; `$geoIntersects` active ward/neighbourhood, parent lookups |
| 35 | GET `/api/v1/admin/area/zones/:zoneId/wards` | `.../getWordsByzone.js` → `getWardsByZone` | protect→adminpass; active Zone and active child Ward queries |
| 36 | GET `/api/v1/admin/area/hierarchy` | `.../getAreaHierarchy.js` → `getAreaHierarchy` | protect→adminpass; filtered Area.find then builds nested tree |
| 37 | GET `/api/v1/admin/area/:areaId/children` | `.../getAreaChildren.js` → `getAreaChildren` | protect→adminpass; active parent + active direct children |
| 38 | DELETE `/api/v1/admin/area/:areaId` | `.../deleteArea.js` → `deleteArea` | protect→adminpass; checks children, sets `isActive=false` (soft delete) |
| 39 | GET `/api/v1/admin/pump/all_pumps` | `routes/adminRoutes/pump/index.js` → `adminPumpController.getAll` | protect→adminpass; optional approvalStatus/search, paginated, populate owner |
| 40 | GET `/api/v1/admin/pump/selected_pump/:id` | same → `.getOne` | protect→adminpass; Pump.findById, populate owner and areaIds |
| 41 | PATCH `/api/v1/admin/pump/approve/:id` | same → `.approve` | protect→adminpass; sets approval/admin/date, clears rejection reason |
| 42 | PATCH `/api/v1/admin/pump/reject/:id` | same → `.reject` | protect→adminpass; requires reason, sets rejected and clears approver/date |
| 43 | PATCH `/api/v1/admin/review/:id/hide` | `routes/adminRoutes/review/index.js` → `toggleReviewHiddenController` | effective protect→adminpass→local protect→Rider/admin; toggle Review and recalc Pump |
| 44 | GET `/api/v1/admin/role/search` | `routes/adminRoutes/User Role Assign Route/getUsers.js` → `searchUserByEmail` | protect→adminpass; exact normalized email User.findOne, safe projection |
| 45 | PATCH `/api/v1/admin/role/update/:userId` | `.../updateUserRole.js` → `updateUserRole` | protect→adminpass; Mongo transaction, User role update + RoleHistory create |
| 46 | GET `/api/v1/admin/role/history/:userId` | `.../getRoleChangeHistory.js` → `getUserRoleHistory` | protect→adminpass; RoleHistory find/count, populate actor, newest first |

### RTK Query notes

- Set `baseUrl` to `http://localhost:8000/api/v1` for current `.env`. Use `credentials: "include"` if using cookie auth; alternatively attach `Authorization: Bearer ${accessToken}` in `prepareHeaders`.
- Cookies are HTTP-only, so React code cannot read `accessToken`; use login JSON `data.accessToken` for explicit Bearer flow or browser credentials mode.
- Admin create/update/delete/tag invalidation should be keyed by Area/Pump/Review/RoleHistory/Service; no response contract uses a shared standard for every legacy endpoint (e.g. registration returns `user`; services listing returns `services`; most newer routes use `data`).
- `DELETE /area/:areaId` is soft deactivation despite HTTP DELETE. `PATCH /review/:id/hide` is a toggle, so an RTK mutation retry can reverse the intended change.
- Query failures can return JSON 401/403/404/500; CORS rejection may be a non-JSON error. An HTML response from the frontend dev server often indicates wrong origin/base URL or a route not served by this API, but no frontend source is available here to diagnose its current parse error.

+## 5. Non-Admin request/response contract detail

The Admin endpoint contracts are in ADMIN_API_REFERENCE.md. This section records the remaining registered endpoints. All paths are relative to /api/v1 unless shown as root. Bodies are JSON where stated. Protected calls require Bearer token or accessToken cookie.

### Authentication and root

| Method/path | Request | Successful response | Errors / DB |
|---|---|---|---|
| GET / | No auth/body | 200 {success:true,message:"PothSeba Backend is running"} | No DB query |
| POST /auth/registration | Public; body {name,email,password,role} | 200 {success:true,message:"registration successfull",user:<created User>} | 400 field errors in message; 409 duplicate email; 500 status fail. User.findOne then create. Security concerns in Section 3. |
| POST /auth/login | Public; body {email,password} | 200 {success:true,message:"Login successful",data:{user:{id,name,email,role},accessToken,technicianProfile}} | 400 missing fields; 401 bad credentials; 500. User.findOne, bcrypt.compare, Technician lookup for Technician role, JWT and cookie. |
| POST /auth/logout | No body/auth required | 200 {success:true,message:"Logout successful"} | 500 {success:false,message:"Logout failed",error}. Clears cookie only; token is not revoked. |

### Protected read APIs

| Method/path | Query/params | Success response / DB behavior | Errors |
|---|---|---|---|
| GET /area/list | None | 200 {success:true,message,data:[areas]}; Area.find isActive true, select name/slug/division/district/upazila, sort name | 401; 403 wrong role; 500 |
| GET /pump/by_area | area required ObjectId; optional fuel; sort=name(default)|rating|fuel_updated; page=1, limit=10 max50 | 200 {success:true,message,data:{pumps,pagination:{page,limit,total,totalPages}}}; approved+active pump filter, areaIds membership, optional available fuel, selected sort | 400 missing/invalid area or sort; 401/403; 500 |
| GET /pump/:pumpId/reviews | pumpId ObjectId; page=1, limit=10 max50 | 200 {success:true,message,data:{reviews,pagination:{page,limit,total,totalPages}}}; approved active pump required; visible reviews only; populate user name; newest first | 400 bad ID; 401/403; 404 pump missing/ineligible; 500 |
| GET /pump/:id | id Pump ObjectId | 200 {success:true,message:"Pump retrieved successfully.",data:pump}; approved+active only; selects publicFields | 400 bad ID; 401/403; 404; 500 |
| GET /allservice/getallService | None | 200 {success:true,message:"Services fetched successfully",services:[...]}; Service.find all, no pagination | 401; 500. Any authenticated role; no admin-only guard. |
| GET /request/findTechnician | longitude,latitude required | 200 {success:true,message,data:{technicians,total,driverLocation}}; 5 km geoNear, approved+online+available, lookup services, nearest first | 400 missing/invalid coordinate; 401; 500 |
| GET /request/getrequest | None | 200 {success:true,total,data:{requests}}; Technician profile by userId, request list populated rider name/service name, newest first | 401; 403 non-Technician; 404 no profile; 500 |
| GET /request/my-requests | None | 200 {success:true,total,data:{requests}}; only current Rider requests, populated Technician shopname/phone and service name, newest first | 401; 403 non-Rider; 500 |
| GET /request/:requestId/location | requestId ObjectId | Rider receives {success:true,data:{requestId,technicianId,coordinates,timestamp}} while tracking active; Technician receives requestId/status/original rider location. Owner-scoped query. | 400 invalid ID; 401/403; 404 wrong owner/profile/no location; 409 tracking unavailable; 500 |

### Technician and Rider mutations

| Method/path | Body | Success response / DB behavior | Errors |
|---|---|---|---|
| POST /create-profile/tecnicianprofile | {shopname,phone,services:[Service ObjectId],location:{type:"Point",coordinates:[lng,lat]}} | 201 {success:true,message,technicianProfile:true,technician,location}; creates Technician for req.user, populates user/services; reverse-geocode address | 400 validation/location; 401; 409 profile exists; 500 |
| PATCH /technician/status | {isOnline:boolean} | 200 {success:true,message,data:{isOnline,isAvailable}}; updates approved profile for current user; offline also sets isAvailable false | 400 invalid bool; 401; 404 profile; 500 |
| POST /request/createRequest | {technicianId,serviceId,location:{type:"Point",coordinates:[lng,lat]},description} | 201 {success:true,message:"Service request sent successfully",data:{request}}; Rider only; validates online/available approved Technician and active offered Service; saves request then emits Socket event | 400 invalid fields/service mismatch; 401; 403 non-Rider; 404 service missing/inactive; 409 technician unavailable; 500 |
| PATCH /request/:requestId/status | {status} | 200 {success:true,message,data:{request}}; Technician transitions pending→accepted/rejected, accepted→on_the_way, on_the_way→in_progress, in_progress→completed; Rider can cancel pending/accepted only; atomic update and socket event | 400 bad ID/status; 401; 403 role; 404 wrong owner/profile; 409 invalid transition/concurrent change; 500 |

Request status enum additionally includes cancelled. No Admin request-management endpoint.

### Pump owner APIs

All require global authentication; pump queries are scoped to req.user._id. There is no explicit pump-owner role middleware on the router.

| Method/path | Query/body | Success response / DB behavior | Errors |
|---|---|---|---|
| POST /pump/create | {name,phone,address,lat,lng}; optional description,email,fuels[],facilities[] | 201 {success:true,message,data:{...pump,detectedAreas}}; spatial Area lookup, reverse geocode, creates pending pump | 400 validation/no matched area; 401; 409 duplicate slug; 500; Mongoose validation 400 |
| GET /pump/my_pumps | page=1,limit=10 max50; search; approvalStatus pending/approved/rejected; isOpen/isActive booleans | 200 {success:true,message,data:{summary,pumps,pagination}}; owner filter; populate areaIds, newest first; summary counts approval/open/closed | 400 invalid filter; 401; 500 |
| PATCH /pump/my_pumps/:pumpId/update | Partial name,description,phone,email,address,lat+lng together,facilities[] | 200 {success:true,message,data:pump}; owner scoped. Name/phone/address/location changes require reapproval and close pump; description/email/facilities do not | 400 validation; 401; 404; 409 duplicate slug; 500 |
| PATCH /pump/my_pumps/:pumpId/status | {isOpen:boolean} | 200 {success:true,message,data:{_id,name,isOpen,isActive,approvalStatus}}; only approved+active may be opened | 400; 401; 403 not approved/inactive; 404; 500 |
| PATCH /pump/my_pumps/:pumpId/fuels | {fuels:[{type,price,available?}]} | 200 {success:true,message,data:pump}; approved pump only; sets fuelsUpdatedAt | 400 invalid fuel; 401; 404; 409 not approved; 500 |
| POST /pump/:pumpId/review | {rating:integer 1..5,comment?:string max500} | 200 {success:true,message,data:{review,avgRating,reviewCount}}; upsert one per user/pump, excludes hidden reviews in recalc | 400; 401; 403 owner; 404 pump missing; 409 pump inactive/unapproved or duplicate race; 500 |
| DELETE /pump/:pumpId/review | No body | 200 {success:true,message,data:{pump,avgRating,reviewCount}}; deletes only caller review and recalculates | 400 bad ID; 401; 404 no own review; 500 |

Fuel enum: Petrol, Octane, Diesel, CNG, LPG, EV. Facilities enum is in Pump model table above. Pump location is GeoJSON Point coordinates [lng,lat]. No file uploads.
## 6. Unmounted, missing and incomplete functionality

### Defined in files but not registered

- `routes/adminRoutes/Area_route/getAllZones.js` defines `GET /zones`, but `Area_route/index.js` does not require/mount it. Therefore `/api/v1/admin/area/zones` is unavailable; use `GET /api/v1/admin/area/all_areas?type=Zone` meanwhile.
- `controllers/tecnicianController/updateAvailability.js` and `updateOnlineStatus.js` are not imported by any registered route. Their apparent request body is `{isAvailable:boolean}` and `{isOnline:boolean}`, but there is no HTTP endpoint for them. Registered `PATCH /api/v1/technician/status` handles `isOnline` only.
- `routes/adminRoutes/Area_route/getWordsByzone.js` is mounted and uses `getWardsByZone`; despite filename typo, endpoint is registered.

### Missing Admin APIs

- `GET /api/v1/admin/technicians`
- `GET /api/v1/admin/technicians/:technicianId`
- `GET /api/v1/admin/technicians/statistics`
- `GET /api/v1/admin/review`
- No combined dashboard statistics endpoint and no User list endpoint.

No Service update/delete API is registered. No Admin pump activation/deactivation route is registered (schema has `isActive`, but admin controller only lists/approves/rejects). Pump `all_pumps` can filter approval status but not isActive or isOpen. No standalone request admin dashboard API exists.

### Security / consistency issues

- Registration accepts client role and allows `admin` per schema; response exposes raw created User, likely including password hash. High priority.
- Role capitalization mismatch: protected target comparison uses `"Admin"` but actual schema role is `"admin"`.
- `POST /api/v1/pump/:pumpId/review` and DELETE have no role middleware beyond login; controller denies pump owner but does not limit role. Public GET pump reviews excludes Technician (`Rider/admin` only).
- The legacy approval alias has no distinct behavior and accepts no body. Rejection has no rejection reason.
- Role update uses Mongo transaction; on standalone MongoDB deployments, transactions may fail with 500.
- Service create missing-name response uses 409; validation errors are inconsistent across legacy controllers.

## 7. Runtime status

The current source has been inspected. Runtime verification and DB record checks are recorded separately in `API_TEST_RESULTS.md`; no live record values are claimed in this source audit.
