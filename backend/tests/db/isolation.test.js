// User B must never read or change user A's rows, through any endpoint or
// directly through PostgREST with B's token (the Row Level Security layer).
const db = require('./helpers');

let alice;
let bob;
let mine;
let snapshot;

const EMPTY_WEEK = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

/** Everything Alice owns, read as the service role. */
async function aliceRows() {
  const tables = ['users', 'tasks', 'exams', 'subtasks', 'notifications', 'chat_history'];
  const entries = await Promise.all(
    tables.map(async (table) => {
      const column = table === 'users' ? 'id' : 'user_id';
      const data = await db.rows(table, { [column]: alice.id });
      return [table, data.sort((a, b) => a.id.localeCompare(b.id))];
    }),
  );
  return Object.fromEntries(entries);
}

beforeAll(async () => {
  [alice, bob] = await Promise.all([db.createUser('alice'), db.createUser('bob')]);
  const app = db.api();

  const task = (
    await app
      .post('/api/tasks')
      .set(alice.auth)
      .send({ title: 'Alice secret essay', due_date: db.hoursFromNow(20) })
  ).body;
  for (const hours of [30, 40]) {
    await app
      .post('/api/tasks')
      .set(alice.auth)
      .send({ title: `Alice task ${hours}`, due_date: db.hoursFromNow(hours) });
  }
  const done = (await app.post('/api/tasks').set(alice.auth).send({ title: 'Done' })).body;
  await app.patch(`/api/tasks/${done.id}`).set(alice.auth).send({ status: 'done' });
  const exam = (await app.post('/api/exams').set(alice.auth).send({ subject: 'Alice exam' })).body;
  const taskSubtask = (
    await app.post('/api/subtasks').set(alice.auth).send({ task_id: task.id, title: 'Outline' })
  ).body;
  const examSubtask = (
    await app.post('/api/subtasks').set(alice.auth).send({ exam_id: exam.id, title: 'Revise' })
  ).body;
  await app.post('/api/notifications/generate-suggestions').set(alice.auth).expect(200);
  const [notification] = (await app.get('/api/notifications').set(alice.auth)).body;
  db.anthropic.messages.create.mockResolvedValue({ content: [{ type: 'text', text: 'Hi Alice' }] });
  await app.post('/api/chat').set(alice.auth).send({ message: 'Alice asks' }).expect(200);
  await app
    .post('/api/upload/save-schedule')
    .set(alice.auth)
    .send({
      schedule: {
        ...EMPTY_WEEK,
        friday: [{ start: '09:00', end: '10:00', subject: 'A', venue: null }],
      },
    })
    .expect(200);

  mine = { task, exam, taskSubtask, examSubtask, notification };
  expect(notification).toBeDefined();
  snapshot = await aliceRows();
});

afterAll(db.deleteUsers);

describe('cross-user isolation through the API', () => {
  it('lists none of Alice’s rows to Bob', async () => {
    const app = db.api();
    const lists = [
      '/api/tasks',
      '/api/exams',
      '/api/subtasks',
      `/api/subtasks?task_id=${mine.task.id}`,
      `/api/subtasks?exam_id=${mine.exam.id}`,
      '/api/notifications',
      '/api/chat/history',
      '/api/analytics/burnout',
    ];
    for (const path of lists) {
      const res = await app.get(path).set(bob.auth);
      expect({ path, status: res.status, body: res.body }).toEqual({ path, status: 200, body: [] });
    }

    const velocity = await app.get('/api/analytics/velocity').set(bob.auth);
    expect(velocity.body.map((week) => week.tasks)).toEqual([0, 0, 0, 0]);

    const profile = await app.get('/api/users/profile').set(bob.auth);
    expect(profile.body).toMatchObject({ id: bob.id, email: bob.email, weekly_schedule: null });
  });

  it('returns 404 when Bob reads, changes or deletes Alice’s rows by id', async () => {
    const app = db.api();
    const attempts = [
      ['get', `/api/tasks/${mine.task.id}`],
      ['patch', `/api/tasks/${mine.task.id}`, { title: 'hijacked', status: 'done' }],
      ['delete', `/api/tasks/${mine.task.id}`],
      ['get', `/api/exams/${mine.exam.id}`],
      ['patch', `/api/exams/${mine.exam.id}`, { subject: 'hijacked' }],
      ['delete', `/api/exams/${mine.exam.id}`],
      ['patch', `/api/subtasks/${mine.taskSubtask.id}`, { status: 'done' }],
      ['delete', `/api/subtasks/${mine.taskSubtask.id}`],
      ['patch', `/api/subtasks/${mine.examSubtask.id}`, { title: 'hijacked' }],
      ['delete', `/api/subtasks/${mine.examSubtask.id}`],
      ['patch', `/api/notifications/${mine.notification.id}/read`],
    ];
    for (const [method, path, body] of attempts) {
      const res = await app[method](path).set(bob.auth).send(body);
      expect({ method, path, status: res.status }).toEqual({ method, path, status: 404 });
    }
  });

  it('does not let Bob attach a subtask to Alice’s task or exam', async () => {
    const app = db.api();
    const onTask = await app
      .post('/api/subtasks')
      .set(bob.auth)
      .send({ task_id: mine.task.id, title: 'Intruder' });
    expect(onTask.status).toBe(404);
    const onExam = await app
      .post('/api/subtasks')
      .set(bob.auth)
      .send({ exam_id: mine.exam.id, title: 'Intruder' });
    expect(onExam.status).toBe(404);
    expect(await db.rows('subtasks', { user_id: bob.id })).toEqual([]);
  });

  it('leaves Alice’s rows alone when Bob uses bulk and profile endpoints', async () => {
    const app = db.api();
    db.anthropic.messages.create.mockResolvedValue({ content: [{ type: 'text', text: 'Hi Bob' }] });

    await app.patch('/api/notifications/read-all').set(bob.auth).expect(200);
    await app.delete('/api/chat/history').set(bob.auth).expect(200);
    await app.post('/api/upload/save-schedule').set(bob.auth).send({ schedule: EMPTY_WEEK });
    await app.patch('/api/users/profile').set(bob.auth).send({ display_name: 'Bob', id: alice.id });
    const suggestion = await app.post('/api/notifications/generate-suggestions').set(bob.auth);
    expect(suggestion.body.message).toBe('No new suggestions needed at this time');

    db.anthropic.messages.create.mockClear();
    await app.post('/api/chat').set(bob.auth).send({ message: 'What is due?' }).expect(200);
    const { system } = db.anthropic.messages.create.mock.calls[0][0];
    expect(system).not.toContain('Alice');
    expect(system).toContain('(no tasks yet)');

    expect(await aliceRows()).toEqual(snapshot);
    const [bobProfile] = await db.rows('users', { id: bob.id });
    expect(bobProfile.display_name).toBe('Bob');
  });
});

describe('cross-user isolation in the database (Row Level Security)', () => {
  // Bob's token used directly against PostgREST, without the API's user_id
  // filters, as a client holding the anon key could.
  let asBob;

  beforeAll(() => {
    const { createUserClient } = require('../../supabaseUserClient');
    asBob = createUserClient(bob.token);
  });

  it('hides Alice’s rows from unfiltered reads', async () => {
    for (const table of ['tasks', 'exams', 'subtasks', 'notifications', 'chat_history']) {
      const { data, error } = await asBob.from(table).select('id, user_id');
      expect(error).toBeNull();
      expect(data.filter((row) => row.user_id === alice.id)).toEqual([]);
    }
    const { data: profiles } = await asBob.from('users').select('id');
    expect(profiles.map((row) => row.id)).toEqual([bob.id]);
  });

  it('matches none of Alice’s rows on update or delete', async () => {
    const updates = await Promise.all([
      asBob.from('tasks').update({ title: 'hijacked' }).eq('id', mine.task.id).select(),
      asBob.from('subtasks').update({ title: 'hijacked' }).eq('id', mine.taskSubtask.id).select(),
      asBob.from('notifications').update({ read_status: true }).neq('id', mine.task.id).select(),
      asBob.from('users').update({ display_name: 'hijacked' }).eq('id', alice.id).select(),
      asBob.from('exams').delete().eq('id', mine.exam.id).select(),
      asBob.from('chat_history').delete().eq('user_id', alice.id).select(),
    ]);
    for (const { data, error } of updates) {
      expect(error).toBeNull();
      expect(data).toEqual([]);
    }
    expect(await aliceRows()).toEqual(snapshot);
  });

  it('rejects rows written in Alice’s name or under her task or exam', async () => {
    const attempts = [
      asBob.from('tasks').insert({ user_id: alice.id, title: 'x' }),
      asBob.from('notifications').insert({ user_id: alice.id, type: 'info', message: 'x' }),
      asBob.from('chat_history').insert({ user_id: alice.id, role: 'user', content: 'x' }),
      asBob.from('subtasks').insert({ user_id: bob.id, task_id: mine.task.id, title: 'x' }),
      asBob.from('subtasks').insert({ user_id: bob.id, exam_id: mine.exam.id, title: 'x' }),
      asBob.from('users').upsert({ id: alice.id, email: alice.email, display_name: 'x' }),
    ];
    for (const { error } of await Promise.all(attempts)) {
      expect(error?.code).toBe('42501');
    }
    expect(await aliceRows()).toEqual(snapshot);
  });
});
