# Pump Admin Frontend API Report

## Scope and authentication

All endpoints in this report are mounted below `BASE_URL` and pass through the `protect` middleware. Send the user's session cookie, or an `Authorization: Bearer <accessToken>` header.

`Pump Admin` means the authenticated pump owner. Owner-only endpoints always use `createdBy: req.user._id`; an owner cannot read or update another owner's pump.

> The API currently does not apply a dedicated Pump Admin role check at the route level. The ownership check in each controller is the authorization boundary.

## What a pump owner can do

1. Create a pump submission. It starts as `pending` and closed.
2. View only their own pumps, with search, filters, pagination, and dashboard counts.
3. Edit their pump profile. Changing name, phone, address, or GPS location sends it back to `pending` approval and closes it.
4. Open or close an approved, active pump.
5. Update fuel prices and availability on an approved pump.

The routes also include review endpoints. They are available to any logged-in user, but a pump owner cannot review their own pump.

## API reference

### 1. Create a pump

`POST /pump/create`

Required request body:

```json
{
  "name": "Example Filling Station",
  "phone": "01700000000",
  "address": "Road 1, Dhaka",
  "lat": 23.7806,
  "lng": 90.407,
  "fuels": [
    { "type": "Petrol", "price": 130, "available": true }
  ],
  "facilities": ["Restroom", "ATM"],
  "description": "Optional description",
  "email": "pump@example.com"
}
```

- Required: `name`, `phone`, `address`, `lat`, `lng`.
- `lat` must be -90 to 90; `lng` must be -180 to 180.
- The backend detects the service area from the coordinates. A point outside a configured area returns `400` with `Service not available in this location`.
- Allowed fuel types: `Petrol`, `Octane`, `Diesel`, `CNG`, `LPG`, `EV`.
- Every fuel needs a non-negative numeric `price`; `available` is optional and defaults to `true`.
- `facilities` is an array of strings. Use only the schema-supported facility values listed in the profile update section below.
- A duplicate pump name returns `409`.

Success: `201`, with the created pump and `detectedAreas`. The initial values are `approvalStatus: "pending"` and `isOpen: false`.

### 2. My pumps dashboard and list

`GET /pump/my_pumps?page=1&limit=10&search=&approvalStatus=&isOpen=&isActive=`

Optional filters:

| Parameter | Valid values |
|---|---|
| `page` | Positive integer; default `1` |
| `limit` | `1`–`50`; default `10` |
| `search` | Matches name, address, or slug |
| `approvalStatus` | `pending`, `approved`, `rejected` |
| `isOpen` | `true`, `false` |
| `isActive` | `true`, `false` |

Success response shape:

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPumps": 3,
      "pendingPumps": 1,
      "approvedPumps": 2,
      "rejectedPumps": 0,
      "openPumps": 1,
      "closedPumps": 2
    },
    "pumps": [],
    "pagination": {
      "totalPumps": 3,
      "currentPage": 1,
      "totalPages": 1,
      "limit": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

Frontend: use `summary` for dashboard cards, `pumps` for the table/cards, and disable next/previous buttons according to the pagination flags.

### 3. Update pump profile

`PATCH /pump/my_pumps/:pumpId/update`

Send only the fields that changed:

```json
{
  "name": "Updated Pump Name",
  "description": "Updated description",
  "phone": "01700000000",
  "email": "pump@example.com",
  "address": "Updated address",
  "lat": 23.7806,
  "lng": 90.407,
  "facilities": ["Restroom", "Prayer Room", "EV Charging"]
}
```

- Send `lat` and `lng` together; never send only one.
- Supported facilities: `Restroom`, `Prayer Room`, `Restaurant`, `Car Wash`, `Air Pump`, `ATM`, `Convenience Store`, `EV Charging`.
- Changing `name`, `phone`, `address`, or coordinates resets the pump to `approvalStatus: "pending"`, clears its prior approval, and sets `isOpen: false`.
- Changing only `description`, `email`, or `facilities` does not need reapproval.
- Use the returned `data` object to replace the updated pump in client state.

### 4. Open or close a pump

`PATCH /pump/my_pumps/:pumpId/status`

```json
{ "isOpen": true }
```

- `isOpen` must be a Boolean, not the string `"true"`.
- Opening is allowed only when `approvalStatus` is `approved` and `isActive` is `true`.
- Closing is allowed for an owned pump regardless of approval status.
- The response returns `_id`, `name`, `isOpen`, `isActive`, and `approvalStatus`.

Frontend: disable the **Open** control and show a clear explanation when the pump is pending, rejected, or inactive. Refresh/update the list row after success.

### 5. Update fuel prices and availability

`PATCH /pump/my_pumps/:pumpId/fuels`

```json
{
  "fuels": [
    { "type": "Petrol", "price": 130, "available": true },
    { "type": "Diesel", "price": 120, "available": false }
  ]
}
```

- This replaces the complete fuel list; keep existing items in the submitted array if they should remain.
- The pump must be owned by the user and have `approvalStatus: "approved"`.
- Same permitted fuel types and price rules as creation apply.
- The response returns the full updated pump, including `fuelsUpdatedAt`.

Frontend: show this editor only for approved pumps. Use toggle controls for `available` and a non-negative numeric input for `price`.

### 6. Submit or edit a review

`POST /pump/:pumpId/review`

```json
{ "rating": 5, "comment": "Good service" }
```

- `rating` must be an integer from `1` to `5`.
- `comment` is optional and limited to 500 characters.
- Calling this again for the same user and pump updates that user's review rather than creating a second one.
- The pump must be approved and active. Its owner cannot review it.
- Response includes the saved review plus recalculated rating summary fields.

### 7. Delete my review

`DELETE /pump/:pumpId/review`

Deletes the logged-in user's review for the selected pump. Success returns the pump ID and recalculated rating summary.

## Recommended frontend screens

### Pump dashboard

- Summary cards: total, pending, approved, rejected, open, closed.
- Search input and filters for approval/open/active states.
- Paginated pump table or cards: name, address, area, approval status, active status, open status, fuel summary, last update, actions.

### Create pump

- Address and map/location picker producing numeric `lat` and `lng`.
- Repeatable fuel rows with fuel type, price, and availability.
- Multi-select facility control.
- On success, show that the submission is pending admin approval.

### Pump detail/edit

- Separate **Profile** and **Fuel** forms.
- Warn before profile changes that name, phone, address, or location will close the pump and require reapproval.
- Do not expose `approvalStatus`, `isActive`, `areaIds`, `division`, `district`, `slug`, `createdBy`, `approvedBy`, or `approvedAt` as editable fields; the backend controls them.

## Error handling

| Status | Frontend behavior |
|---|---|
| `400` | Display the validation message beside the relevant field/form. |
| `401` | Clear expired login state and redirect to sign-in. |
| `403` | Show the returned permission/status reason; do not retry automatically. |
| `404` | Remove or refresh the missing pump/review from local state. |
| `409` | Show conflict information: duplicate name, pending approval, or ineligible pump status. |
| `500` | Show a generic retry message while preserving form input. |
