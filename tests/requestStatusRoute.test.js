require("../config/env");

const assert = require("node:assert/strict");
const Module = require("node:module");
const { after, before, test } = require("node:test");
const express = require("express");
const http = require("node:http");
const realProtect = require("../middlwares/protect");

const dispatches = [];
const installMock = (modulePath, exports) => {
  const mockedModule = new Module(modulePath);
  mockedModule.filename = modulePath;
  mockedModule.loaded = true;
  mockedModule.exports = exports;
  require.cache[modulePath] = mockedModule;
};

// Keep this a route-mount test: bypass auth and database access, then assert
// the request reaches the status controller through the complete router tree.
installMock(require.resolve("../middlwares/protect"), (_req, _res, next) => next());
installMock(
  require.resolve("../controllers/requestController/updateRequestStatusController"),
  (req, res) => {
    dispatches.push({ requestId: req.params.requestId, status: req.body.status });
    return res.status(204).end();
  }
);

const router = require("../routes/index");
const requestRoutes = require("../routes/requestRoutes");
const app = express();
app.use(express.json());
app.use(router);

const authApp = express();
authApp.use(express.json());
authApp.use(process.env.BASE_URL, realProtect, requestRoutes);

let server;
let authServer;
let origin;
let authOrigin;

const listen = async (serverToListen) => {
  await new Promise((resolve, reject) => {
    serverToListen.once("error", reject);
    serverToListen.listen(0, "127.0.0.1", resolve);
  });
  return `http://127.0.0.1:${serverToListen.address().port}`;
};

before(async () => {
  server = http.createServer(app);
  authServer = http.createServer(authApp);
  [origin, authOrigin] = await Promise.all([listen(server), listen(authServer)]);
});

after(async () => {
  await Promise.all([server, authServer].filter(Boolean).map((httpServer) =>
    new Promise((resolve, reject) => httpServer.close((error) => error ? reject(error) : resolve()))
  ));
});

test("PATCH /api/v1/request/:requestId/status dispatches through the full router tree", async () => {
  assert.equal(process.env.BASE_URL, "/api/v1", "test expects the documented /api/v1 prefix");
  const requestId = "6adbc55ed5f1aab5bdfbe891";
  const response = await fetch(`${origin}/api/v1/request/${requestId}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "accepted" }),
  });

  assert.equal(response.status, 204);
  assert.deepEqual(dispatches, [{ requestId, status: "accepted" }]);
});

test("PATCH under the request API prefix requires authentication", async () => {
  const response = await fetch(`${authOrigin}/api/v1/request/6adbc55ed5f1aab5bdfbe891/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "accepted" }),
  });
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.message, "Unauthorized request");
});
