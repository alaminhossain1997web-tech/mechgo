+# PothSeba Admin API Reference

Source of truth: current route registration, middleware, controller and model code. Examples use synthetic IDs/values and are illustrative, not live DB results. No backend code changed. Local base URL: http://localhost:8000/api/v1 (current PORT=8000, BASE_URL=/api/v1). Admin endpoints require Authorization: Bearer <accessToken> and role admin (lowercase). Send Content-Type: application/json for JSON bodies.

## Authentication

POST /api/v1/auth/login is public. Body: {"email":"admin@example.com","password":"<password>"}. Success 200:
{"success":true,"message":"Login successful","data":{"user":{"id":"66a000000000000000000001","name":"Dashboard Admin","email":"admin@example.com","role":"admin"},"accessToken":"<omitted>","technicianProfile":false}}
JWT expires in one day. Use data.accessToken as Bearer token. Login also sets HTTP-only accessToken cookie.

## Technician decisions

No Admin technician GET/list endpoint is registered. technicianId is the Technician document _id, not linked User _id. All three below require Bearer/admin and ignore query/body.

### Approve

Method PATCH
URL http://localhost:8000/api/v1/admin/pending_technician/:technicianId/approve
Success 200:
{"success":true,"message":"Technician approved successfully","technician":{"_id":"66a000000000000000000002","userId":"66a000000000000000000001","shopname":"Example Workshop","phone":"+8801700000000","services":[],"location":{"type":"Point","coordinates":[90.4,23.8]},"isOnline":false,"isAvailable":false,"verificationStatus":"approved"}}
Controller sets verificationStatus approved, isOnline false, isAvailable false with Technician.findByIdAndUpdate. Errors: 401 auth, 403 role, 404 {success:false,message:"Technician not found"}, 500 {success:false,message:"Internal server error",error:"..."}. Invalid ObjectId is not explicitly checked and can reach 500. Controller: controllers/adminContoller/pending_request/approveTechnician.js.

### Approval alias

PATCH http://localhost:8000/api/v1/admin/pending_technician/:technicianId uses the same approval controller, query, mutation, success/error shape. Body ignored; it is only an alias.

### Reject

PATCH http://localhost:8000/api/v1/admin/pending_technician/:technicianId/reject; Bearer/admin; no body/query. Sets verificationStatus rejected and both online/available false. Success shape is same as approval with message "Technician rejected successfully" and status rejected. No rejection reason is accepted. Controller: controllers/adminContoller/pending_request/rejectTechnician.js. Rejected records remain in MongoDB.

## Pump management

### List pumps

GET http://localhost:8000/api/v1/admin/pump/all_pumps
Query: optional approvalStatus=pending|approved|rejected, search (name or phone), page default 1, limit default 10/max 50. No body. Controller adminPumpController.getAll; Pump.find/count; populate createdBy name/email; newest first.
Success 200:
{"success":true,"message":"Pumps retrieved successfully.","data":{"pumps":[{"_id":"66a000000000000000000003","name":"Example Fuel","approvalStatus":"pending","isActive":true,"isOpen":false,"avgRating":0,"reviewCount":0,"createdBy":{"_id":"66a000000000000000000001","name":"Owner","email":"owner@example.com"}}],"pagination":{"page":1,"limit":10,"total":1,"totalPages":1}}}
Invalid approvalStatus 400 {success:false,message:"Invalid approval status."}; unexpected 500 {success:false,message:"Failed to retrieve pumps."}. No isActive/isOpen/area/fuel filters.

### Pump detail

GET http://localhost:8000/api/v1/admin/pump/selected_pump/:id; Bearer/admin; id is Pump ObjectId; no query/body. Pump.findById populates owner name/email and areaIds name/slug/division/district/upazila. Success 200 {success:true,message:"Pump retrieved successfully.",data:<pump>}. Invalid ID 400, absent 404, unexpected 500. Controller adminPumpController.getOne.

### Approve pump

PATCH http://localhost:8000/api/v1/admin/pump/approve/:id; Bearer/admin; no body. Sets approvalStatus approved, approvedBy current admin, approvedAt now, clears rejectionReason. Does not alter isActive/isOpen. Success 200 {success:true,message:"Pump approved successfully.",data:<pump>}; invalid ID 400, absent 404, already approved 409, unexpected 500. Controller adminPumpController.approve.

### Reject pump

PATCH http://localhost:8000/api/v1/admin/pump/reject/:id; Bearer/admin. Required body:
{"reason":"Incomplete pump information"}
Reason must be a nonempty string. Sets rejected/rejectionReason and clears approvedBy/approvedAt. Success 200 {success:true,message:"Pump rejected successfully.",data:<pump>}; malformed ID or missing reason 400, absent 404, already rejected 409, unexpected 500. Controller adminPumpController.reject. No Admin activation/deactivation route exists.

## User and role management

### Search user

GET http://localhost:8000/api/v1/admin/role/search?email=user@example.com; Bearer/admin. email required and email-format checked, normalized lowercase. No body. User.findOne selects _id name email role isActive createdAt (User schema does not define isActive, so it is normally absent). Success 200 {success:true,message:"User found successfully.",data:{_id,name,email,role,...}}. Invalid/missing email 400; missing user 404; unexpected 500. Controller searchUserByEmail in controllers/adminContoller/Role Controller/userRoleController.js.

### Update role

PATCH http://localhost:8000/api/v1/admin/role/update/:userId; Bearer/admin. Body:
{"role":"Technician","reason":"Verified technician profile"}
Allowed role values: User, Rider, Technician, PumpOwner. Optional reason string max 300. Prevents self change; target-admin protection compares "Admin" uppercase while schema uses lowercase "admin". Mongo transaction updates User and creates RoleHistory atomically. Success 200 {success:true,message:"User role updated successfully.",data:{_id,name,email,role,...}}. Errors 400 invalid ID/role/reason; 401 absent req.user; 403 self/protected target; 404 absent User; 409 same role/concurrent update; 500 transaction/unexpected. Controller updateUserRole; models User and RoleHistory. Mongo must support transactions.

### Role history

GET http://localhost:8000/api/v1/admin/role/history/:userId; Bearer/admin. Query page default 1, limit default 10/max 50. No body. User.exists; RoleHistory.find/count; populate changedBy name/email; omit __v; newest first.
Success 200:
{"success":true,"message":"Role history retrieved successfully.","data":[{"_id":"66a000000000000000000004","userId":"66a000000000000000000002","previousRole":"User","newRole":"Technician","changedBy":{"_id":"66a000000000000000000001","name":"Admin","email":"admin@example.com"},"reason":"Verified profile","createdAt":"2026-11-09T10:00:00.000Z"}],"pagination":{"total":1,"currentPage":1,"totalPages":1,"limit":10,"hasNextPage":false,"hasPrevPage":false}}
Invalid ID 400; user absent 404; unexpected 500. Controller getUserRoleHistory.

## Area management

All registered Area endpoints require protect then adminpass. JSON request bodies work through express.json. Area types: Zone, Ward, Neighbourhood. Zone has no parent; Ward parentAreaId must reference an active Zone; Neighbourhood parentAreaId must reference an active Ward. Boundary optional Polygon/MultiPolygon. Examples omit boundary; do not fabricate it.

### Create Zone

POST http://localhost:8000/api/v1/admin/area/create
Body:
{"name":"Dhaka North Zone 1","nameBn":"ঢাকা উত্তর জোন ১","type":"Zone","division":"Dhaka","district":"Dhaka","cityCorporation":"DNCC","zoneNo":1,"areaSqKm":12.5}
name, division, district, type required; Zone requires integer-like zoneNo and no parentAreaId. Optional nameBn, slug, upazila, cityCorporation, areaSqKm, boundary. slug generated from supplied slug or name.
Success 201 {success:true,message:"Zone created successfully.",data:<Area>}.

### Create Ward

Same method and URL. parentAreaId is active Zone ObjectId; wardNo required integer-like:
{"name":"Ward 1","type":"Ward","parentAreaId":"66a000000000000000000010","division":"Dhaka","district":"Dhaka","cityCorporation":"DNCC","wardNo":1}
zoneNo inherited from parent. Success message "Ward created successfully."

### Create Neighbourhood

Same method and URL. parentAreaId is active Ward ObjectId:
{"name":"Mirpur Section 1","type":"Neighbourhood","parentAreaId":"66a000000000000000000011","division":"Dhaka","district":"Dhaka","cityCorporation":"DNCC"}
Success message "Neighbourhood created successfully."
Create errors: 400 required/type/parent-type/number/boundary/slug; 404 missing/inactive parent; 409 duplicate slug; 500 unexpected. Controller createArea, model Area.

### List areas

GET http://localhost:8000/api/v1/admin/area/all_areas
Query: search, division, district, upazila, type, parentAreaId, zoneNo, wardNo, isActive=true|false, includeBoundary=true|false (default false), page default 1, limit default 10/max 100. Search matches name/nameBn/slug/district/cityCorporation. Location text filters case-insensitive partial. DB populates parent (name/type/zoneNo/wardNo) and createdBy (name/email), sorts type/zoneNo/wardNo/createdAt descending, paginates and counts.
Success 200 shape:
{"success":true,"message":"Areas retrieved successfully.","total":1,"pagination":{"currentPage":1,"limit":10,"totalPages":1},"filters":{"type":"Zone","zoneNo":null,"wardNo":null},"data":[{"_id":"66a000000000000000000010","name":"Dhaka North Zone 1","type":"Zone","parentAreaId":null,"isActive":true}]}
Invalid filter 400; unexpected 500. Controller getAllAreas.

### Selected area

GET http://localhost:8000/api/v1/admin/area/selected_area/:areaId; query includeBoundary=true|false default true. Populates parent/creator; for Zone/Ward adds active children.
Success {success:true,message:"Area retrieved successfully.",data:{...area,children:[]}}. Invalid ID/query 400; absent 404; unexpected 500. Controller getSingleArea.

### Update area

PATCH http://localhost:8000/api/v1/admin/area/update_areas/:areaId
Partial body fields: name, nameBn, slug, division, district, upazila, cityCorporation, areaSqKm, boundary, isActive. type and parentAreaId explicitly rejected. boundary:null removes boundary.
Example: {"name":"Updated Ward Name","nameBn":"নতুন নাম","areaSqKm":2.4}
Success {success:true,message:"Area updated successfully.",data:<Area>}. Invalid 400; absent 404; duplicate slug 409; unexpected 500. Controller updateArea.

### Set area active state

PATCH http://localhost:8000/api/v1/admin/area/:areaId/status
Body {"isActive":false}; strict Boolean. Parent must be active to activate; no active child may exist to deactivate.
Success {success:true,message:"Area deactivated successfully",data:<Area>}. Invalid ID/body 400, absent 404, hierarchy constraint 400, unexpected 500. Controller updateAreaStatus.

### Delete (soft deactivate)

DELETE http://localhost:8000/api/v1/admin/area/:areaId; no body. Sets isActive false; does not delete document. Any child, even inactive, blocks operation; already inactive returns 400.
Success {success:true,message:"Area deactivated successfully",data:<Area>}; invalid ID 400, absent 404, child exists 400 with childArea, unexpected 500. Controller deleteArea.

### Find by location

POST http://localhost:8000/api/v1/admin/area/find-by-location
Body {"lat":23.8,"lng":90.4}; validates latitude -90..90 and longitude -180..180. Finds active Ward/Neighbourhood polygons with $geoIntersects and resolves parent Ward/Zone.
Success {success:true,message:"Area location matched successfully",coordinates:{lat:23.8,lng:90.4},totalMatches:1,data:[{neighbourhood:null,ward:{...},zone:{...}}]}. No match 404 with data:null; invalid coordinates 400; unexpected 500. Controller findAreaByLocation.

### Wards, children and hierarchy

GET http://localhost:8000/api/v1/admin/area/zones/:zoneId/wards?includeBoundary=false
Only active Zone/Wards; query includeBoundary true|false default false. Success {success:true,message:"Wards retrieved successfully.",zone:{_id,name,zoneNo,cityCorporation},total,data:[...]}. Invalid ID/query 400; Zone missing/inactive 404; unexpected 500. Controller getWardsByZone.

GET http://localhost:8000/api/v1/admin/area/:areaId/children
Active parent and active direct children only; Zone→Ward, Ward→Neighbourhood. Neighbourhood returns 400. Success {success:true,message:"Child areas retrieved successfully.",parent:{_id,name,type},childType,total,data:[...]}. Invalid ID 400; absent 404; unexpected 500. Controller getAreaChildren.

GET http://localhost:8000/api/v1/admin/area/hierarchy?cityCorporation=&division=&district=&isActive=true|false
Filters Areas, excludes boundary, assembles nested tree in memory. Success {success:true,totalZones,totalAreas,data:[Zone tree]}. Invalid isActive 400; unexpected 500. Controller getAreaHierarchy.

Not registered: GET /api/v1/admin/area/zones (route definition exists but Area aggregator does not mount it); use /area/all_areas?type=Zone.

## Review moderation

PATCH http://localhost:8000/api/v1/admin/review/:id/hide; no query/body. Effective auth: global protect→adminpass then local protect→allowRiderOrAdmin (admin passes). Toggles isHidden, saves Review, recalculates Pump average/count from visible reviews.
Success 200 {success:true,message:"Review hidden successfully."| "Review unhidden successfully.",data:{review,avgRating,reviewCount}}. Invalid ID 400; Review absent 404; unexpected 500. Controller toggleReviewHiddenController; Review/Pump models.

GET /api/v1/admin/review is missing. Admin cannot obtain a review table, reviewer email/pump name population, or paginated review list. Public GET is per approved active pump, hides hidden records, populates reviewer name only, and allows Rider/admin (not Technician).

## Postman guide

Set baseUrl to http://localhost:8000/api/v1. For all Admin routes select Authorization → Bearer Token, using login data.accessToken. Add Content-Type: application/json for bodies. Example queries:
- GET /admin/pump/all_pumps?approvalStatus=pending&page=1&limit=10
- GET /admin/area/all_areas?type=Ward&isActive=true&page=1&limit=10
- GET /admin/area/selected_area/{{areaId}}?includeBoundary=false
- GET /admin/role/search?email=user@example.com
- GET /admin/role/history/{{userId}}?page=1&limit=10

Mutation bodies are given in their endpoint sections. Technician approve/reject, pump approve, area delete and review toggle have no body. Expected envelopes/errors are documented per operation. All examples are illustrative and must not be treated as a test response.

See BACKEND_COMPLETE_AUDIT.md for the complete registered route inventory and MISSING_BACKEND_APIS.md for gap definitions.

