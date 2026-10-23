const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const http = require("node:http");
const { initializeSocket } = require("../config/socket");

const server = http.createServer();
const io = initializeSocket(server);
let origin;

before(async () => {
  await new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", resolve);
    server.once("error", reject);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => io.close(resolve));
});

test("Socket.IO polling handshake is served from /socket.io/ with configured frontend CORS", async () => {
  const response = await fetch(`${origin}/socket.io/?EIO=4&transport=polling`, {
    headers: { Origin: "https://pothseba.netlify.app" },
  });
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://pothseba.netlify.app");
  assert.ok(body.startsWith("0{"), "Engine.IO should return its polling open packet");
});
