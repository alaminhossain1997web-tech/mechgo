+# Missing Backend APIs and Incomplete Functionality

This document separates confirmed registered APIs from gaps established by route aggregator inspection. Recommendations below are design guidance only; no API or backend source was created/changed.

## Missing Admin APIs

### 1. Technician list

Requested: GET /api/v1/admin/technicians
Status: MISSING. There is no registered GET route/controller for Technician collection listing. Admin only has approve/reject mutations requiring a known Technician document ID.

Recommended contract:
- Admin-only, optional verificationStatus in pending|approved|rejected, search, page, limit.
- Query Technician; populate userId with name/email/role and services with name.
- Return data.technicians plus pagination {page,limit,total,totalPages}; validate ObjectId/filter values and bound limit.
- Do not expose User.password or arbitrary document internals.

### 2. Technician detail

Requested: GET /api/v1/admin/technicians/:technicianId
Status: MISSING.
Recommended: validate Mongo ObjectId, Technician.findById, populate safe User fields and services, 404 for missing profile. Clearly identify whether param is Technician._id (recommended to match approve/reject routes).

### 3. Technician statistics

Requested: GET /api/v1/admin/technicians/statistics
Status: MISSING.
Recommended: aggregate Technician grouped by verificationStatus and return explicit counts for pending, approved, rejected, plus total. This should use the actual enum values. Note Technician has no timestamps and no unique userId constraint.

### 4. Admin review list

Requested: GET /api/v1/admin/review
Status: MISSING. Existing Admin can toggle a review only if frontend already knows its ID. Public GET requires a pump ID, excludes hidden reviews, and populates reviewer name only.

Recommended:
- Admin-only paginated list sorted createdAt descending.
- Populate user with name/email and pump with name (optionally slug).
- Return review ID, reviewer, pump, rating, comment, createdAt, isHidden, and pagination.
- Consider filters isHidden, rating, pumpId, userId, page, limit; explicitly document exact accepted enum/ranges.

### 5. Dashboard summary

Status: MISSING. No combined API for all cards. Current ability:
- Pumps: total and per approvalStatus can be derived using GET /admin/pump/all_pumps and its data.pagination.total (separate calls per status).
- Areas: GET /admin/area/all_areas returns total; filters change count.
- Services: GET /allservice/getallService returns all service docs, count array length.
- Users: no list/count API.
- Technicians: no list/count API.
- Reviews: no global Review count API. Pump.reviewCount is visible review count only; summing across all pump pages is an inefficient proxy, not the total Review collection count.
Recommended summary endpoint should specify global counts and whether review count includes hidden records, and should aggregate in MongoDB rather than fetching paginated lists.

### 6. User list and counts

Status: MISSING. Role search is by exact email only; no list/filter/page/statistic API. Admin dashboard cannot list users or calculate total users.

### 7. Zone-only list route

A leaf route file routes/adminRoutes/Area_route/getAllZones.js and controller getAllZones exist, but routes/adminRoutes/Area_route/index.js never mounts the leaf router. GET /api/v1/admin/area/zones is therefore MISSING at runtime. Current workaround: GET /api/v1/admin/area/all_areas?type=Zone (supports pagination and broader area filters).

### 8. Service edit/delete

Status: MISSING. Existing service routes: Admin POST create and authenticated GET all. There is no update/delete API, no isActive toggle endpoint, and no category model/field. Service model has isActive but admin create controller only reads name/description/icon.

### 9. Admin Pump activation/status APIs

Status: MISSING. Admin can list, detail, approve and reject pumps. Pump schema has isActive but no admin route/controller to activate/deactivate. Pump owner can update isOpen, but only for approved active pumps. Admin listing has no isActive/isOpen/area/fuel filter.

### 10. Request administration

Status: MISSING for Admin dashboard. Request APIs are rider/technician-oriented; no admin request list/details/statistics/moderation endpoint is registered.

## Existing but incomplete or risky

| Feature | Current behavior | Impact / recommended action |
|---|---|---|
| Technician approvals | Approve/reject works by Technician _id, no list API, no status precondition; reject body ignored | Add list and detail before building admin table; decide whether only pending can transition |
| Technician rejection | No reason stored | Add reason/audit field only if product needs this; frontend cannot send one today |
| Role protection | User role enum uses lowercase admin; update controller compares target to uppercase Admin | Align casing and explicitly ensure admin accounts cannot be modified |
| Registration | Public endpoint accepts role; schema allows admin; raw User returned | Critical: restrict public role assignment and exclude password hash from response |
| Pump rejection | Requires arbitrary nonempty body reason; no max length declared in controller/schema | Add maximum/validation if needed; frontend must send {reason:string} |
| Review moderation | One PATCH toggles visibility rather than setting explicit state | Non-idempotent; add explicit hide/unhide or boolean body if retry safety is needed |
| Service create | Missing name responds 409, duplicate also 409; catch errors 500 | Frontend must not assume missing-field is 400; normalize backend errors |
| Area deletion | DELETE performs soft deactivate and blocks on any child, active or inactive | Label frontend action as deactivate/archive, not permanent delete |
| Zone query route | File exists but not mounted | Mounting requires backend change; workaround documented above |
| Review permissions | GET review allows Rider/admin, not Technician; create/delete are login-only and reject pump owner only | Confirm product access policy and then enforce consistent role gates |
| Transactions | Role update uses session.withTransaction | Ensure production/local Mongo deployment supports transactions; otherwise mutation returns 500 |

## Integration order

1. Address public registration privilege escalation and password-hash serialization.
2. Implement Admin Technician list/detail/statistics so approvals can be discovered and summarized.
3. Implement Admin review list with safe populations and pagination.
4. Implement combined dashboard summary and User counts if cards require them.
5. Decide whether to mount the existing zones route and whether Service/Pump admin state-management routes are needed.
6. Align response envelopes, validation statuses, role casing, and review hide semantics.
7. Add authenticated integration tests using non-production seed data before wiring dashboard mutations.

## Not recommended as a frontend workaround

- Do not query MongoDB directly from React or expose DB credentials.
- Do not treat 401 as success or infer a route exists from the OpenAPI/Postman file.
- Do not hardcode pending technician lists from approval mutation responses.
- Do not use Pump.reviewCount as total review document count without clearly labeling it visible reviews only.
- Do not use public registration to create admin users.
