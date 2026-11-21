const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, before, test } = require("node:test");
const app = require("../server");
const pool = require("../db");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve) => server.close(resolve));
  }
  await pool.end();
});

async function request(path, method = "GET", body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    ...(body && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  });
  return { status: response.status, body: await response.json() };
}

test("the root endpoint reports that the backend is running", async () => {
  assert.deepEqual(await request("/"), {
    status: 200,
    body: { message: "EventFlow backend deluje!" }
  });
});

test("the database endpoint reports a successful connection", async (t) => {
  const time = "2026-11-21T12:00:00.000Z";
  const query = t.mock.method(pool, "query", async () => ({ rows: [{ now: time }] }));

  const result = await request("/api/db-test");
  assert.equal(result.status, 200);
  assert.equal(result.body.time, time);
  assert.deepEqual(query.mock.calls[0].arguments, ["SELECT NOW()"]);
});

test("a public event search returns only published events and binds the filters", async (t) => {
  const events = [{ id: 3, title: "Koncert" }];
  const query = t.mock.method(pool, "query", async () => ({ rows: events }));

  const result = await request("/api/events?search=+Koncert+&categoryId=1&date=2027-01-15");
  const [sql, filters] = query.mock.calls[0].arguments;

  assert.deepEqual(result, { status: 200, body: { events } });
  assert.match(sql, /events\.status = 'PUBLISHED'/);
  assert.deepEqual(filters, ["%Koncert%", 1, "2027-01-15"]);
});

test("a public event search rejects a nonpositive category", async () => {
  assert.equal((await request("/api/events?categoryId=0")).status, 400);
});

test("a public event search rejects an invalid date format", async () => {
  assert.equal((await request("/api/events?date=15-01-2027")).status, 400);
});

test("participant registration requires all fields", async () => {
  assert.equal((await request("/api/users/register", "POST", {})).status, 400);
});

test("participant registration rejects a password shorter than eight characters", async () => {
  const result = await request("/api/users/register", "POST", {
    firstName: "Ana", lastName: "Novak", email: "ana@example.org", password: "short"
  });

  assert.equal(result.status, 400);
  assert.match(result.body.message, /8 znakov/);
});

test("participant registration rejects a malformed email address", async () => {
  const result = await request("/api/users/register", "POST", {
    firstName: "Ana", lastName: "Novak", email: "invalid", password: "long-enough"
  });

  assert.equal(result.status, 400);
  assert.match(result.body.message, /e-poštni naslov/);
});

test("organization registration requires a nonblank name", async () => {
  const result = await request("/api/organizations/register", "POST", {
    name: "  ", email: "team@example.org", password: "long-enough"
  });

  assert.equal(result.status, 400);
  assert.match(result.body.message, /obvezna polja/);
});

test("event creation requires authentication", async () => {
  assert.equal((await request("/api/events", "POST", {})).status, 401);
});

test("a participant must authenticate before signing up for an event", async () => {
  assert.equal((await request("/api/events/1/register", "POST")).status, 401);
});

test("a participant must authenticate before cancelling their signup", async () => {
  assert.equal((await request("/api/events/1/cancel-registration", "PATCH")).status, 401);
});
