const db = require('./helpers');

afterAll(db.deleteUsers);

describe('analytics against the real database', () => {
  it('counts tasks completed this week from the completed_at the trigger sets', async () => {
    const user = await db.createUser('finisher');
    const app = db.api();
    const ids = [];
    for (const title of ['One', 'Two', 'Three']) {
      ids.push((await app.post('/api/tasks').set(user.auth).send({ title })).body.id);
    }
    await app.patch(`/api/tasks/${ids[0]}`).set(user.auth).send({ status: 'done' }).expect(200);
    await app.patch(`/api/tasks/${ids[1]}`).set(user.auth).send({ status: 'done' }).expect(200);

    const res = await app.get('/api/analytics/velocity').set(user.auth);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4);
    expect(res.body.map((week) => week.tasks)).toEqual([0, 0, 0, 2]);

    // Reopening a task clears its completion time, so it stops counting.
    await app.patch(`/api/tasks/${ids[1]}`).set(user.auth).send({ status: 'stuck' }).expect(200);
    const after = await app.get('/api/analytics/velocity').set(user.auth);
    expect(after.body.map((week) => week.tasks)).toEqual([0, 0, 0, 1]);
  });

  it('places older completions in earlier weeks and ignores those over four weeks ago', async () => {
    const user = await db.createUser('veteran');
    const app = db.api();
    const ids = [];
    for (const title of ['Recent', 'Last week', 'Too old']) {
      const { body } = await app.post('/api/tasks').set(user.auth).send({ title, status: 'done' });
      ids.push(body.id);
    }
    // Backdate the completion times; only a direct update can set them.
    const backdate = async (id, hours) => {
      const { error } = await db.service
        .from('tasks')
        .update({ completed_at: db.hoursFromNow(-hours) })
        .eq('id', id);
      if (error) throw error;
    };
    await backdate(ids[1], 24 * 8);
    await backdate(ids[2], 24 * 40);

    const res = await app.get('/api/analytics/velocity').set(user.auth);
    expect(res.body.map((week) => week.tasks)).toEqual([0, 0, 1, 1]);
  });

  it('finds a cluster of open deadlines within 48 hours', async () => {
    const user = await db.createUser('crammer');
    const app = db.api();
    const tasks = [
      ['A', 10],
      ['B', 20],
      ['C', 40],
      ['Done', 15, 'done'],
      ['Far', 24 * 10],
      ['Undated', null],
    ];
    for (const [title, hours, status] of tasks) {
      await app
        .post('/api/tasks')
        .set(user.auth)
        .send({ title, due_date: hours === null ? null : db.hoursFromNow(hours), status })
        .expect(201);
    }

    const res = await app.get('/api/analytics/burnout').set(user.auth);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ task_count: 3, tasks: ['A', 'B', 'C'] });
  });
});
