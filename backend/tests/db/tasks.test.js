const db = require('./helpers');

let alice;

beforeAll(async () => {
  alice = await db.createUser('alice');
});
afterAll(db.deleteUsers);

describe('tasks against the real database', () => {
  it('creates, reads, updates and deletes a task', async () => {
    const app = db.api();

    const created = await app.post('/api/tasks').set(alice.auth).send({
      title: 'Essay',
      due_date: '2026-11-01T09:00:00Z',
      grade_weight: 20,
      estimated_hours: 4.5,
      course_code: 'ENG 101',
      user_id: '00000000-0000-4000-8000-000000000000',
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      title: 'Essay',
      user_id: alice.id,
      status: 'not_started',
      grade_weight: 20,
      estimated_hours: 4.5,
      completed_at: null,
    });
    const id = created.body.id;

    const list = await app.get('/api/tasks').set(alice.auth);
    expect(list.status).toBe(200);
    expect(list.body.map((task) => task.id)).toEqual([id]);

    const one = await app.get(`/api/tasks/${id}`).set(alice.auth);
    expect(one.status).toBe(200);
    expect(one.body.title).toBe('Essay');

    const updated = await app
      .patch(`/api/tasks/${id}`)
      .set(alice.auth)
      .send({ title: 'Final essay', status: 'in_progress', ai_reasoning: 'Due soon' });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ title: 'Final essay', status: 'in_progress' });
    expect(new Date(updated.body.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(created.body.updated_at).getTime(),
    );

    const deleted = await app.delete(`/api/tasks/${id}`).set(alice.auth);
    expect(deleted.status).toBe(200);
    expect(deleted.body.task.id).toBe(id);
    expect(await db.rows('tasks', { id })).toEqual([]);
  });

  it('stores an empty due date as NULL and sorts dated tasks first', async () => {
    const app = db.api();
    await app.post('/api/tasks').set(alice.auth).send({ title: 'Undated', due_date: '' });
    await app.post('/api/tasks').set(alice.auth).send({ title: 'Later', due_date: '2026-12-01' });
    await app.post('/api/tasks').set(alice.auth).send({ title: 'Sooner', due_date: '2026-11-01' });

    const list = await app.get('/api/tasks').set(alice.auth);
    expect(list.body.map((task) => task.title)).toEqual(['Sooner', 'Later', 'Undated']);
    expect(list.body[2].due_date).toBeNull();
  });

  it('sets completed_at when a task is done and clears it when reopened', async () => {
    const app = db.api();
    const { body: task } = await app.post('/api/tasks').set(alice.auth).send({ title: 'Lab' });

    const done = await app.patch(`/api/tasks/${task.id}`).set(alice.auth).send({ status: 'done' });
    expect(done.body.completed_at).not.toBeNull();

    // Editing a done task keeps its completion time.
    const renamed = await app
      .patch(`/api/tasks/${task.id}`)
      .set(alice.auth)
      .send({ title: 'Lab report' });
    expect(renamed.body.completed_at).toBe(done.body.completed_at);

    const reopened = await app
      .patch(`/api/tasks/${task.id}`)
      .set(alice.auth)
      .send({ status: 'in_progress' });
    expect(reopened.body.completed_at).toBeNull();

    const createdDone = await app
      .post('/api/tasks')
      .set(alice.auth)
      .send({ title: 'Already done', status: 'done' });
    expect(createdDone.body.completed_at).not.toBeNull();
  });

  it('returns 404 for a task that does not exist', async () => {
    const app = db.api();
    const missing = '00000000-0000-4000-8000-000000000000';

    expect((await app.get(`/api/tasks/${missing}`).set(alice.auth)).status).toBe(404);
    expect(
      (await app.patch(`/api/tasks/${missing}`).set(alice.auth).send({ title: 'x' })).status,
    ).toBe(404);
    expect((await app.delete(`/api/tasks/${missing}`).set(alice.auth)).status).toBe(404);
  });

  it('rejects a request without a valid token', async () => {
    const res = await db.api().get('/api/tasks').set({ Authorization: 'Bearer not-a-jwt' });
    expect(res.status).toBe(401);
  });
});
