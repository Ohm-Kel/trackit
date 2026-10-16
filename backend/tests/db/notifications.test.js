const db = require('./helpers');

afterAll(db.deleteUsers);

async function addTasks(app, user, dueDates) {
  for (const [index, due] of dueDates.entries()) {
    await app
      .post('/api/tasks')
      .set(user.auth)
      .send({ title: `Task ${index + 1}`, due_date: due })
      .expect(201);
  }
}

describe('notifications against the real database', () => {
  it('generates a workload alert once, then lists and marks it read', async () => {
    const user = await db.createUser('busy');
    const app = db.api();
    await addTasks(app, user, [db.hoursFromNow(24), db.hoursFromNow(48), db.hoursFromNow(72)]);
    // Done and far-off tasks do not count.
    await app
      .post('/api/tasks')
      .set(user.auth)
      .send({ title: 'Done', status: 'done', due_date: db.hoursFromNow(10) });
    await addTasks(app, user, [db.hoursFromNow(24 * 30)]);

    const first = await app.post('/api/notifications/generate-suggestions').set(user.auth);
    expect(first.status).toBe(200);
    expect(first.body.message).toBe('Suggestion generated');
    expect(first.body.suggestion).toMatchObject({ type: 'ai_suggestion', user_id: user.id });
    expect(first.body.suggestion.message).toContain('3 tasks due in the next 4 days');

    // An identical unread suggestion is not stacked.
    const again = await app.post('/api/notifications/generate-suggestions').set(user.auth);
    expect(again.body.message).toBe('No new suggestions needed at this time');

    const list = await app.get('/api/notifications').set(user.auth);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ type: 'ai_suggestion', read_status: false });

    const read = await app.patch(`/api/notifications/${list.body[0].id}/read`).set(user.auth);
    expect(read.status).toBe(200);
    expect((await db.rows('notifications', { id: list.body[0].id }))[0].read_status).toBe(true);

    // Once read, a new one may be generated.
    const fresh = await app.post('/api/notifications/generate-suggestions').set(user.auth);
    expect(fresh.body.message).toBe('Suggestion generated');
  });

  it('sends a gentle reminder for a single upcoming task', async () => {
    const user = await db.createUser('calm');
    const app = db.api();
    await addTasks(app, user, [db.hoursFromNow(30)]);

    const res = await app.post('/api/notifications/generate-suggestions').set(user.auth);
    expect(res.body.suggestion).toMatchObject({ type: 'info' });
    expect(res.body.suggestion.message).toContain('"Task 1" is due soon');
  });

  it('suggests nothing without upcoming tasks', async () => {
    const user = await db.createUser('idle');
    const res = await db.api().post('/api/notifications/generate-suggestions').set(user.auth);
    expect(res.body.message).toBe('No new suggestions needed at this time');
    expect(await db.rows('notifications', { user_id: user.id })).toEqual([]);
  });

  it('marks every unread notification as read', async () => {
    const user = await db.createUser('reader');
    const { error } = await db.service.from('notifications').insert([
      { user_id: user.id, type: 'info', message: 'One' },
      { user_id: user.id, type: 'warning', message: 'Two' },
    ]);
    if (error) throw error;

    const res = await db.api().patch('/api/notifications/read-all').set(user.auth);
    expect(res.status).toBe(200);
    const stored = await db.rows('notifications', { user_id: user.id });
    expect(stored.map((n) => n.read_status)).toEqual([true, true]);
  });

  it('returns 404 for a notification that does not exist', async () => {
    const user = await db.createUser('nobody');
    const res = await db
      .api()
      .patch('/api/notifications/00000000-0000-4000-8000-000000000000/read')
      .set(user.auth);
    expect(res.status).toBe(404);
  });
});
