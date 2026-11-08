require("../config/env");

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const http = require("node:http");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { generateAccessToken } = require("../helpers/utils");

// Disable automatic index creation in this process. This test only inspects indexes.
mongoose.set("autoIndex", false);
process.env.BASE_URL = "/api/v1";

const app = express();
app.use(express.json());
app.use(require("../routes/index"));

const User = require("../models/authSchema/userSchema");
const Pump = require("../models/pumpSchema/pumpSchema");
const Area = require("../models/Area/areaSchema");
const Review = require("../models/Review/reviewSchema");

const prefix = `review-e2e-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`;
const created = { users: [], areas: [], pumps: [], reviews: [] };
let server;
let connected = false;
let api;
let runFailed = false;

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const recordId = (type, id) => {
  const value = String(id);
  if (!created[type].includes(value)) created[type].push(value);
};
const callApi = async (method, path, token, body) => {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, json: await response.json() };
};
const logPass = (scenario) => console.log(`PASS ${scenario}`);

const createRider = async (name, suffix) => {
  const user = await User.create({
    name: `${prefix} ${name}`,
    email: `${prefix}-${suffix}@example.test`,
    password: `${prefix}-temporary-password`,
    role: "Rider",
  });
  recordId("users", user._id);
  return user;
};
const createPump = async (name, areaId, ownerId, avgRating, fuelsUpdatedAt) => {
  const pump = await Pump.create({
    name: `${prefix} ${name}`,
    slug: `${prefix}-${name.toLowerCase().replaceAll(" ", "-")}`,
    address: `${prefix} test address`,
    division: "Test Division",
    district: "Test District",
    locationName: `${prefix} test location`,
    areaIds: [areaId],
    location: { type: "Point", coordinates: [90, 23] },
    fuels: [{ type: "Petrol", price: 120, available: true }],
    fuelsUpdatedAt,
    approvalStatus: "approved",
    isActive: true,
    isOpen: true,
    avgRating,
    reviewCount: 0,
    createdBy: ownerId,
  });
  recordId("pumps", pump._id);
  return pump;
};
const expectSummary = (json, avgRating, reviewCount, label) => {
  assert.equal(json.data.avgRating, avgRating, `${label}: avgRating`);
  assert.equal(json.data.reviewCount, reviewCount, `${label}: reviewCount`);
};
const createReview = async (pumpId, token, rating, comment) => {
  const result = await callApi("POST", `/pump/${pumpId}/review`, token, { rating, comment });
  assert.equal(result.status, 200, `Create review failed (${result.status}): ${result.json.message}`);
  if (result.json.data?.review?._id) recordId("reviews", result.json.data.review._id);
  return result.json;
};
const readExistingDuplicateGroups = async () => {
  try {
    const rows = await Review.collection.aggregate([
      { $group: { _id: { pump: "$pump", user: "$user" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $project: { pump: "$_id.pump", user: "$_id.user", count: 1, _id: 0 } },
    ]).toArray();
    return rows.map((row) => ({ pump: String(row.pump), user: String(row.user), count: row.count }));
  } catch (error) {
    if (error.codeName === "NamespaceNotFound") return [];
    throw error;
  }
};

const run = async () => {
  if (!process.env.DB_URL) throw new Error("Configured DB_URL is missing.");
  await mongoose.connect(process.env.DB_URL, { serverSelectionTimeoutMS: 10000, autoIndex: false });
  connected = true;
  console.log("MongoDB connection: PASS (configured DB_URL; autoIndex disabled)");

  const existingDuplicateGroups = await readExistingDuplicateGroups();
  console.log(`Existing duplicate review pairs before test: ${existingDuplicateGroups.length}`);

  const owner = await createRider("Owner", "owner");
  const userA = await createRider("Reviewer A", "reviewer-a");
  const userB = await createRider("Reviewer B", "reviewer-b");
  const adminId = new mongoose.Types.ObjectId();
  const adminEmail = `${prefix}-admin@example.test`;
  const adminPassword = await bcrypt.hash(`${prefix}-temporary-password`, 10);
  await User.collection.insertOne({
    _id: adminId,
    name: `${prefix} Admin`,
    email: adminEmail,
    password: adminPassword,
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  recordId("users", adminId);

  const area = await Area.create({
    name: `${prefix} isolated test area`,
    slug: `${prefix}-isolated-area`,
    division: "Test Division",
    district: "Test District",
    upazila: `${prefix} Upazila`,
    isActive: true,
    createdBy: owner._id,
    boundary: {
      type: "Polygon",
      coordinates: [[[89, 22], [91, 22], [91, 24], [89, 24], [89, 22]]],
    },
  });
  recordId("areas", area._id);

  const mainPump = await createPump("Alpha Pump", area._id, owner._id, 0, new Date(Date.now() - 300000));
  const higherRatedPump = await createPump("Bravo Pump", area._id, owner._id, 4.8, new Date(Date.now() - 200000));
  const lowerRatedPump = await createPump("Charlie Pump", area._id, owner._id, 1.2, new Date(Date.now() - 100000));

  const ownerToken = generateAccessToken(owner);
  const userAToken = generateAccessToken(userA);
  const userBToken = generateAccessToken(userB);
  const adminToken = generateAccessToken({ _id: adminId, email: adminEmail, role: "admin" });

  server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  api = `http://127.0.0.1:${server.address().port}/api/v1`;

  let first = await createReview(mainPump._id, userAToken, 5, "  excellent  ");
  const firstReviewId = String(first.data.review._id);
  assert.equal(first.data.review.comment, "excellent");
  expectSummary(first, 5, 1, "first review");
  logPass("reviewer A created rating 5; comment trimmed");

  await pause(30);
  const second = await createReview(mainPump._id, userBToken, 3, "good");
  const secondReviewId = String(second.data.review._id);
  expectSummary(second, 4, 2, "second review");
  assert.equal(await Review.countDocuments({ pump: mainPump._id }), 2);
  logPass("reviewer B created rating 3; average 4.0 and count 2");

  const updated = await createReview(mainPump._id, userAToken, 1, "updated rating");
  assert.equal(String(updated.data.review._id), firstReviewId, "upsert should retain the review document");
  expectSummary(updated, 2, 2, "updated review");
  assert.equal(await Review.countDocuments({ pump: mainPump._id, user: userA._id }), 1);
  logPass("review update changed rating to 1 without creating a duplicate; average 2.0/count 2");

  const nonAdminHide = await callApi("PATCH", `/admin/review/${secondReviewId}/hide`, userAToken, {});
  assert.equal(nonAdminHide.status, 403, "non-admin must not hide reviews");
  logPass("non-admin hide request rejected with 403");

  const hidden = await callApi("PATCH", `/admin/review/${secondReviewId}/hide`, adminToken, {});
  assert.equal(hidden.status, 200, `Admin hide failed: ${hidden.json.message}`);
  assert.equal(hidden.json.data.review.isHidden, true);
  expectSummary(hidden.json, 1, 1, "hidden review");
  const hiddenPublic = await callApi("GET", `/pump/${mainPump._id}/reviews?page=1&limit=10`);
  assert.equal(hiddenPublic.status, 200);
  assert.equal(hiddenPublic.json.data.pagination.total, 1);
  assert.equal(hiddenPublic.json.data.reviews.length, 1);
  logPass("admin hid reviewer B; hidden review excluded and rating became 1.0/count 1");

  const unhidden = await callApi("PATCH", `/admin/review/${secondReviewId}/hide`, adminToken, {});
  assert.equal(unhidden.status, 200, `Admin unhide failed: ${unhidden.json.message}`);
  assert.equal(unhidden.json.data.review.isHidden, false);
  expectSummary(unhidden.json, 2, 2, "unhidden review");
  logPass("admin unhid reviewer B; average returned to 2.0/count 2");

  const ownerReview = await callApi("POST", `/pump/${mainPump._id}/review`, ownerToken, { rating: 5, comment: "owner" });
  assert.equal(ownerReview.status, 403);
  logPass("pump owner review attempt rejected with 403");

  const crossDelete = await callApi("DELETE", `/pump/${mainPump._id}/review`, ownerToken);
  assert.equal(crossDelete.status, 404, "owner has no own review; B review must not be deleted");
  assert.ok(await Review.exists({ _id: secondReviewId, user: userB._id }));
  logPass("user without an owned review could not delete reviewer B review (404; B record remains)");

  const publicReviews = await callApi("GET", `/pump/${mainPump._id}/reviews?page=1&limit=10`);
  assert.equal(publicReviews.status, 200);
  assert.equal(publicReviews.json.data.pagination.total, 2);
  for (const review of publicReviews.json.data.reviews) {
    assert.equal(review.isHidden, false);
    assert.ok(review.user && review.user.name);
    assert.equal(Object.hasOwn(review.user, "email"), false);
    assert.equal(Object.hasOwn(review.user, "phone"), false);
  }
  const pageOne = await callApi("GET", `/pump/${mainPump._id}/reviews?page=1&limit=1`);
  const pageTwo = await callApi("GET", `/pump/${mainPump._id}/reviews?page=2&limit=1`);
  assert.equal(pageOne.json.data.pagination.total, 2);
  assert.equal(pageOne.json.data.pagination.totalPages, 2);
  assert.equal(pageOne.json.data.reviews.length, 1);
  assert.equal(pageTwo.json.data.reviews.length, 1);
  assert.notEqual(String(pageOne.json.data.reviews[0]._id), String(pageTwo.json.data.reviews[0]._id));
  assert.equal(String(pageOne.json.data.reviews[0]._id), secondReviewId, "newest review should be first");
  logPass("public reviews exclude hidden items/private user fields; newest-first pagination works");

  const byName = await callApi("GET", `/pump/by_area?area=${area._id}&sort=name&page=1&limit=50`);
  assert.equal(byName.status, 200);
  const byRating = await callApi("GET", `/pump/by_area?area=${area._id}&sort=rating&page=1&limit=50`);
  assert.equal(byRating.status, 200);
  const byFuel = await callApi("GET", `/pump/by_area?area=${area._id}&sort=fuel_updated&page=1&limit=50`);
  assert.equal(byFuel.status, 200);
  const expectedIds = {
    name: [mainPump, higherRatedPump, lowerRatedPump].map((pump) => String(pump._id)),
    rating: [higherRatedPump, mainPump, lowerRatedPump].map((pump) => String(pump._id)),
    fuel_updated: [lowerRatedPump, higherRatedPump, mainPump].map((pump) => String(pump._id)),
  };
  for (const [sort, result] of [["name", byName], ["rating", byRating], ["fuel_updated", byFuel]]) {
    const rows = result.json.data.pumps;
    assert.deepEqual(rows.map((pump) => String(pump._id)), expectedIds[sort], `${sort} ordering`);
    for (const pump of rows) {
      assert.equal(typeof pump.avgRating, "number");
      assert.equal(typeof pump.reviewCount, "number");
    }
  }
  logPass("public pump sorting: name asc, rating desc, fuelsUpdatedAt desc; rating fields present");

  const removed = await callApi("DELETE", `/pump/${mainPump._id}/review`, userAToken);
  assert.equal(removed.status, 200, `Review deletion failed: ${removed.json.message}`);
  expectSummary(removed.json, 3, 1, "delete first review");
  assert.equal(await Review.exists({ _id: firstReviewId }), null);
  assert.ok(await Review.exists({ _id: secondReviewId }));
  logPass("reviewer A deleted own review; remaining rating recalculated to 3.0/count 1");

  const finalPump = await Pump.findById(mainPump._id).lean();
  assert.equal(finalPump.avgRating, 3);
  assert.equal(finalPump.reviewCount, 1);
  console.log("Final persisted main pump rating: 3.0; reviewCount: 1");
  console.log("Existing duplicate review pairs (before test):", JSON.stringify(existingDuplicateGroups));

  let actualIndexes = [];
  try {
    actualIndexes = await Review.collection.indexes();
  } catch (error) {
    if (error.codeName !== "NamespaceNotFound") throw error;
  }
  const expectedUniqueIndex = actualIndexes.some((index) => index.key?.pump === 1 && index.key?.user === 1 && index.unique === true);
  const expectedLookupIndex = actualIndexes.some((index) => index.key?.pump === 1 && index.key?.isHidden === 1 && index.key?.createdAt === -1);
  console.log("Actual review collection indexes:", JSON.stringify(actualIndexes.map(({ name, key, unique }) => ({ name, key, unique: Boolean(unique) }))));
  console.log(`Required unique index present: ${expectedUniqueIndex}; required lookup index present: ${expectedLookupIndex}`);
  console.log("Index inspection: PASS (read-only; no indexes created)");
  logPass("all review workflow, visibility, privacy, pagination, and sorting assertions passed");
};

const cleanup = async () => {
  const summary = {
    reviews: { deleted: [], alreadyAbsent: [], failed: [] },
    pumps: { deleted: [], alreadyAbsent: [], failed: [] },
    areas: { deleted: [], alreadyAbsent: [], failed: [] },
    users: { deleted: [], alreadyAbsent: [], failed: [] },
  };

  if (!connected) {
    console.log("Cleanup summary:", JSON.stringify(summary));
    return summary;
  }

  try {
    const recoverable = await Review.find({
      pump: { $in: created.pumps.map((id) => new mongoose.Types.ObjectId(id)) },
      user: { $in: created.users.map((id) => new mongoose.Types.ObjectId(id)) },
    }).select("_id").lean();
    for (const review of recoverable) recordId("reviews", review._id);
  } catch (error) {
    summary.reviews.failed.push({ id: null, reason: `Could not recover test-created review IDs: ${error.message}` });
  }

  const removeTrackedIds = async (label, model) => {
    for (const id of created[label]) {
      try {
        const result = await model.collection.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
        if (result.deletedCount === 1) summary[label].deleted.push(id);
        else if (!(await model.collection.findOne({ _id: new mongoose.Types.ObjectId(id) }))) summary[label].alreadyAbsent.push(id);
        else summary[label].failed.push({ id, reason: "Tracked document still exists after cleanup attempt." });
      } catch (error) {
        summary[label].failed.push({ id, reason: error.message });
      }
    }
  };

  // Separate collection-level cleanup attempts ensure one failure never skips another collection.
  try { await removeTrackedIds("reviews", Review); } catch (error) { summary.reviews.failed.push({ id: null, reason: error.message }); }
  try { await removeTrackedIds("pumps", Pump); } catch (error) { summary.pumps.failed.push({ id: null, reason: error.message }); }
  try { await removeTrackedIds("areas", Area); } catch (error) { summary.areas.failed.push({ id: null, reason: error.message }); }
  try { await removeTrackedIds("users", User); } catch (error) { summary.users.failed.push({ id: null, reason: error.message }); }

  console.log("Cleanup summary:", JSON.stringify(summary, null, 2));
  return summary;
};

(async () => {
  try {
    await run();
  } catch (error) {
    runFailed = true;
    console.error("TEST FAILURE:", error.stack || error.message);
  } finally {
    if (server?.listening) {
      try {
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
        console.log("Test HTTP server: stopped");
      } catch (error) {
        runFailed = true;
        console.error("HTTP server shutdown failed:", error.message);
      }
    }
    const cleanupSummary = await cleanup();
    if (Object.values(cleanupSummary).some((group) => group.failed.length)) runFailed = true;
    if (connected) {
      try {
        await mongoose.disconnect();
      } catch (error) {
        runFailed = true;
        console.error("MongoDB disconnect failed:", error.message);
      }
    }
    if (runFailed) process.exitCode = 1;
  }
})();





