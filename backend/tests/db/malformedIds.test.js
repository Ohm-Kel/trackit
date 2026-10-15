// Regression: a non-UUID id reached Postgres, which rejected the cast
// (22P02), and the API answered 500 instead of 404.
const db = require('./helpers');

let user;

beforeAll(async () => {
  user = await db.createUser('typo');
});
afterAll(db.deleteUsers);

it.each([
  ['get', '/api/tasks/not-a-uuid', {}],
  ['patch', '/api/tasks/not-a-uuid', { title: 'x' }],
  ['delete', '/api/tasks/123', {}],
  ['get', '/api/exams/not-a-uuid', {}],
  ['patch', '/api/exams/not-a-uuid', { subject: 'x' }],
  ['delete', '/api/exams/123', {}],
  ['patch', '/api/subtasks/not-a-uuid', { title: 'x' }],
  ['delete', '/api/subtasks/123', {}],
  ['patch', '/api/notifications/not-a-uuid/read', {}],
])('%s %s with a malformed id returns 404', async (method, path, body) => {
  const res = await db.api()[method](path).set(user.auth).send(body);
  expect(res.status).toBe(404);
  expect(res.body.error).toMatch(/not found/);
});
