+# React Admin Dashboard Frontend Integration Guide

This maps current backend contracts to frontend work. No React source is present in this workspace, so current component names, RTK Query endpoints and UI expectations cannot be confirmed.

## Confirmed API configuration

- Local URL: http://localhost:8000/api/v1 (PORT=8000 and BASE_URL=/api/v1 in current .env).
- Admin role is lowercase admin; capitalized Admin will fail adminpass.
- Login: POST /auth/login; read data.accessToken and data.user fields.
- Send Authorization: Bearer <accessToken>. Browser cookie requests require credentials: include; the accessToken cookie is HTTP-only and cannot be read by React JavaScript.
- CORS allows localhost:5173 and https://pothseba.netlify.app; cross-origin cookie calls need credentials.
- Error envelopes vary. Inspect HTTP status and response Content-Type before assuming JSON.

## Feature-to-backend matrix

| Feature | Existing backend API | Status and actual field mapping | Frontend consequence |
|---|---|---|---|
| Admin login | POST /auth/login | Available; data.user.id/name/email/role and data.accessToken | Store token using app policy; role must be lowercase admin |
| Total Users / user table | None | Missing | No User list/count |
| Search user | GET /admin/role/search?email= | Available; data._id/name/email/role; exact email only | Search-only, no pagination/list |
| Change role | PATCH /admin/role/update/:userId | Available; body role/reason; response data user | Handle 400/403/404/409/500; protected target case mismatch |
| Role history | GET /admin/role/history/:userId | Available; data array and pagination | Use User ID path parameter |
| Technician list/details | None | Missing | No Admin table or details endpoint |
| Technician status counts | None | Missing | No status aggregation endpoint |
| Approve/reject technician | PATCH /admin/pending_technician/:technicianId/approve or /reject | Available; response technician document; no reason body | Frontend needs Technician _id from another source |
| Total pumps | GET /admin/pump/all_pumps | Available; data.pagination.total | page=1, limit=1 is sufficient for count |
| Pump approval counts | Same with approvalStatus=pending/approved/rejected | Available via separate filtered counts | Three requests; no combined count |
| Pump table/details | GET /admin/pump/all_pumps and /selected_pump/:id | Available; list owner populated; detail owner and areas populated | No isActive/isOpen/area/fuel list filters |
| Approve/reject pump | PATCH /admin/pump/approve/:id and /reject/:id | Available; reject body reason required | Invalidate pump list/detail |
| Total areas | GET /admin/area/all_areas | Available; top-level total | Omit filters, page=1, limit=1 |
| Area tree/detail/edit | /admin/area/hierarchy, /:areaId/children, /selected_area/:areaId, /update_areas/:areaId | Available; see API reference for contracts | Use actual nested hierarchy response |
| Area create/status/deactivate | POST /admin/area/create, PATCH /:areaId/status, DELETE /:areaId | Available; Delete is soft deactivation | Respect hierarchy errors; DELETE does not remove document |
| Zone list | GET /admin/area/zones | Not registered | Use /admin/area/all_areas?type=Zone |
| Total services/list | GET /allservice/getallService | Available, requires any valid login; services array | Count services.length; no pagination |
| Create service | POST /admin/services/createService | Available; name required, optional description/icon | No update/delete; duplicate 409 |
| Total review/review table | None for Admin | Missing | No Admin review listing or pagination |
| Hide/unhide review | PATCH /admin/review/:id/hide | Available; data.review and rating summary; toggles | Not idempotent; avoid retrying blindly |
| Combined dashboard cards | None | Missing | Users, technician counts, review totals unavailable |

## Count mapping currently possible

- Total pumps: GET /admin/pump/all_pumps?page=1&limit=1; read data.pagination.total.
- Pump counts by approval state: call the same endpoint once per approvalStatus; read each data.pagination.total.
- Total areas: GET /admin/area/all_areas?page=1&limit=1; read total.
- Total services: GET /allservice/getallService; use services.length.
- Total users and Technician counts: unavailable.
- Total reviews: no direct global total. Pump.reviewCount is visible-review count maintained from non-hidden Review documents; summing every pump page is inefficient and does not count hidden reviews.

## RTK Query setup pattern

Adapt to the project's actual conventions; no frontend source was available to verify this exact setup.

    const baseApi = createApi({
      reducerPath: "api",
      baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:8000/api/v1",
        prepareHeaders: (headers, { getState }) => {
          const token = getState().auth?.accessToken;
          if (token) headers.set("Authorization", "Bearer " + token);
          return headers;
        },
      }),
      endpoints: (builder) => ({
        getAdminPumps: builder.query({
          query: (params) => ({ url: "/admin/pump/all_pumps", params }),
        }),
        getAreas: builder.query({
          query: (params) => ({ url: "/admin/area/all_areas", params }),
        }),
        getServices: builder.query({
          query: () => "/allservice/getallService",
        }),
      }),
    });

For cookie-only auth, set credentials: "include" in fetchBaseQuery. For Bearer auth, read the token from login JSON. Suggested invalidation: pump mutations → pump list/detail; area mutations → area list/tree/detail; role mutation → user search/history; review toggle → review/pump data.

## HTML instead of JSON

Backend handlers return JSON, but React may receive HTML from the frontend dev server, a wrong API base URL, proxy fallback, or infrastructure error page. Inspect fetchBaseQuery status/originalStatus/data and Content-Type. Confirm requests use http://localhost:8000/api/v1 and server startup logged Mongo connection and listen. 401 indicates authentication required/failed, 403 role denial, 404 may be a missing route or missing record. A 401 does not verify successful operation.

## Integration constraints

- Registration accepts caller-provided role and schema allows admin; response appears to serialize password hash. Do not provision admin through public signup; remediate backend.
- /admin/area/zones is defined in a leaf route file but not mounted.
- Technician GET/list/statistics and Admin review list are missing.
- Area DELETE is soft deactivation; review hide route toggles state.
- Pump reject requires reason; Technician reject ignores body.
- Service listing is authenticated but not Admin-only.
- Service create missing name returns 409.
- User search selects isActive, absent from User schema.
- Role update uses Mongo transaction; standalone MongoDB may fail.
- Public pump review GET allows Rider/admin but not Technician; review create/delete are login-only, with own-pump restriction.
- Use ADMIN_API_REFERENCE.md for exact contracts and MISSING_BACKEND_APIS.md for recommended backend additions.
