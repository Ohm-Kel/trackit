const db = require('./helpers');

let alice;
let task;
let exam;

beforeAll(async () => {
  alice = await db.createUser('alice');
  const app = db.api();
  task = (await app.post('/api/tasks').set(alice.auth).send({ title: 'Project' })).body;
  exam = (await app.post('/api/exams').set(alice.auth).send({ subject: 'Physics' })).body;
});
afterAll(db.deleteUsers);

describe('subtasks against the real database', () => {
  it('creates, lists, updates and deletes subtasks of a task', async () => {
    const app = db.api();

    const second = await app
      .post('/api/subtasks')
      .set(alice.auth)
      .send({ task_id: task.id, title: 'Write up', order_index: 1, estimated_hours: 2 });
    const first = await app
      .post('/api/subtasks')
      .set(alice.auth)
      .send({ task_id: task.id, title: 'Research', order_index: 0 });
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({
      user_id: alice.id,
      task_id: task.id,
      exam_id: null,
      status: 'not_started',
    });

    const list = await app.get(`/api/subtasks?task_id=${task.id}`).set(alice.auth);
    expect(list.status).toBe(200);
    expect(list.body.map((subtask) => subtask.title)).toEqual(['Research', 'Write up']);

    const updated = await app
      .patch(`/api/subtasks/${first.body.id}`)
      .set(alice.auth)
      .send({ status: 'done', title: 'Research sources' });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ status: 'done', title: 'Research sources' });

    const deleted = await app.delete(`/api/subtasks/${second.body.id}`).set(alice.auth);
    expect(deleted.status).toBe(200);
    expect(await db.rows('subtasks', { id: second.body.id })).toEqual([]);
  });

  it('creates and filters subtasks of an exam', async () => {
    const app = db.api();
    const created = await app
      .post('/api/subtasks')
      .set(alice.auth)
      .send({ exam_id: exam.id, title: 'Past papers' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ exam_id: exam.id, task_id: null });

    const list = await app.get(`/api/subtasks?exam_id=${exam.id}`).set(alice.auth);
    expect(list.body.map((subtask) => subtask.id)).toEqual([created.body.id]);
  });

  it('rejects a parent that does not exist', async () => {
    const res = await db
      .api()
      .post('/api/subtasks')
      .set(alice.auth)
      .send({ task_id: '00000000-0000-4000-8000-000000000000', title: 'x' });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });

  it('deletes subtasks with their parent task', async () => {
    const app = db.api();
    const parent = (await app.post('/api/tasks').set(alice.auth).send({ title: 'Temp' })).body;
    const child = await app
      .post('/api/subtasks')
      .set(alice.auth)
      .send({ task_id: parent.id, title: 'Step' });

    await app.delete(`/api/tasks/${parent.id}`).set(alice.auth).expect(200);
    expect(await db.rows('subtasks', { id: child.body.id })).toEqual([]);
  });

  it('returns 404 for a subtask that does not exist', async () => {
    const app = db.api();
    const missing = '00000000-0000-4000-8000-000000000000';
    expect(
      (await app.patch(`/api/subtasks/${missing}`).set(alice.auth).send({ title: 'x' })).status,
    ).toBe(404);
    expect((await app.delete(`/api/subtasks/${missing}`).set(alice.auth)).status).toBe(404);
  });
});
