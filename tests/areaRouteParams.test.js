const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const express = require("express");
const http = require("node:http");
const mongoose = require("mongoose");
const Area = require("../models/Area/areaSchema");

const areaId = new mongoose.Types.ObjectId();
const calls = [];
let findByIdMode = "get";
let server;
let origin;
const originalFindById = Area.findById;

Area.findById = (id) => {
  calls.push(String(id));
  const area = {
    _id: id,
    name: "Test Area",
    slug: "test-area",
    division: "Dhaka",
    district: "Dhaka",
    upazila: "Test Upazila",
    isActive: true,
    boundary: { type: "Polygon", coordinates: [] },
    save: async function () { return this; },
  };

  if (findByIdMode === "get") {
    return { populate: async () => area };
  }
  return Promise.resolve(area);
};

const app = express();
app.use(express.json());
app.use("/api/v1/admin", (req, _res, next) => {
  req.user = { _id: new mongoose.Types.ObjectId(), role: "admin" };
  next();
}, require("../routes/adminRoutes/Area_route"));

const listen = async () => {
  server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
};

before(listen);
after(async () => {
  Area.findById = originalFindById;
  if (server?.listening) {
    await new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    );
  }
});

test("GET selected Area resolves a valid :areaId parameter", async () => {
  findByIdMode = "get";
  const response = await fetch(`${origin}/api/v1/admin/area/selected_area/${areaId}`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.name, "Test Area");
  assert.equal(calls.at(-1), String(areaId));
});

test("GET selected Area rejects an invalid ObjectId with 400", async () => {
  const callCount = calls.length;
  const response = await fetch(`${origin}/api/v1/admin/area/selected_area/not-an-object-id`);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.message, "Invalid area ID.");
  assert.equal(calls.length, callCount);
});

test("PATCH Area resolves a valid :areaId parameter", async () => {
  findByIdMode = "update";
  const response = await fetch(`${origin}/api/v1/admin/area/update_areas/${areaId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Updated Test Area" }),
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.name, "Updated Test Area");
  assert.equal(calls.at(-1), String(areaId));
});

test("PATCH Area rejects an invalid ObjectId with 400", async () => {
  const callCount = calls.length;
  const response = await fetch(`${origin}/api/v1/admin/area/update_areas/not-an-object-id`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Should Not Update" }),
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.message, "Invalid area ID.");
  assert.equal(calls.length, callCount);
});
