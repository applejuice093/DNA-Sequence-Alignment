// HTTP-level tests for request validation and error handling. Every request
// here is rejected (or answered) before the database is touched, so no MongoDB
// instance is needed.
const test = require("node:test");
const assert = require("node:assert/strict");

const { createApp, HEALTH_MESSAGE } = require("../app");

let server;
let baseUrl;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => {
  server.close();
});

async function post(path, body, raw = false) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? body : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}

test("GET / reports the health message", async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { message: HEALTH_MESSAGE });
});

test("POST /api/align requires both sequences", async () => {
  const { status, data } = await post("/api/align", { seqA: "ACGT", algorithm: "global" });
  assert.equal(status, 400);
  assert.match(data.message, /required/);
});

test("POST /api/align rejects non-nucleotide characters", async () => {
  const { status, data } = await post("/api/align", { seqA: "ACGX", seqB: "ACG", algorithm: "global" });
  assert.equal(status, 400);
  assert.match(data.message, /A, C, G, T and U/);
});

test("POST /api/align rejects overly long sequences", async () => {
  const { status, data } = await post("/api/align", { seqA: "A".repeat(500), seqB: "A", algorithm: "local" });
  assert.equal(status, 400);
  assert.match(data.message, /at most/);
});

test("POST /api/align rejects an unknown algorithm", async () => {
  const { status, data } = await post("/api/align", { seqA: "ACGT", seqB: "ACG", algorithm: "semi-global" });
  assert.equal(status, 400);
  assert.match(data.message, /global' or 'local/);
});

test("POST /api/align rejects non-numeric scoring", async () => {
  const { status, data } = await post("/api/align", { seqA: "ACGT", seqB: "ACG", algorithm: "global", gap: "abc" });
  assert.equal(status, 400);
  assert.equal(data.message, "gap must be a number.");
});

test("POST /api/bruteforce-demo returns counters for short input", async () => {
  const { status, data } = await post("/api/bruteforce-demo", { seqA: "ag", seqB: "ac" });
  assert.equal(status, 200);
  assert.equal(data.seqA, "AG");
  assert.equal(data.score, 0); // A/A match (+1), G/C mismatch (-1)
  assert.ok(data.callCount > 0);
  assert.ok(data.recursionTree);
});

test("POST /api/bruteforce-demo rejects input above the demo limit", async () => {
  const { status, data } = await post("/api/bruteforce-demo", { seqA: "ACGTACG", seqB: "A" });
  assert.equal(status, 400);
  assert.match(data.message, /up to length 6/);
});

test("DELETE /api/history/:id rejects malformed ids", async () => {
  const response = await fetch(`${baseUrl}/api/history/not-an-id`, { method: "DELETE" });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: "Invalid history id." });
});

test("malformed JSON bodies get a JSON 400", async () => {
  const { status, data } = await post("/api/align", "{not json", true);
  assert.equal(status, 400);
  assert.equal(data.message, "Request body is not valid JSON.");
});

test("unknown routes get a JSON 404", async () => {
  const response = await fetch(`${baseUrl}/api/does-not-exist`);
  assert.equal(response.status, 404);
  assert.match((await response.json()).message, /Route not found/);
});

test("requests from non-local origins are refused with 403", async () => {
  const response = await fetch(`${baseUrl}/`, { headers: { Origin: "https://example.com" } });
  assert.equal(response.status, 403);
});
