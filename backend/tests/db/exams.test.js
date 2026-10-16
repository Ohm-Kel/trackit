const db = require('./helpers');

let alice;

beforeAll(async () => {
  alice = await db.createUser('alice');
});
afterAll(db.deleteUsers);

describe('exams against the real database', () => {
  it('creates, reads, updates and deletes an exam', async () => {
    const app = db.api();

    const created = await app
      .post('/api/exams')
      .set(alice.auth)
      .send({
        subject: 'Calculus',
        course_code: 'MATH 201',
        exam_date: '2026-12-10',
        topics: ['Limits', 'Series'],
        daily_study_hours: 1.5,
      });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      subject: 'Calculus',
      user_id: alice.id,
      confidence_level: 'medium',
      preparation_percent: 0,
      topics: ['Limits', 'Series'],
      daily_study_hours: 1.5,
    });
    const id = created.body.id;

    const list = await app.get('/api/exams').set(alice.auth);
    expect(list.body.map((exam) => exam.id)).toEqual([id]);
    expect((await app.get(`/api/exams/${id}`).set(alice.auth)).body.subject).toBe('Calculus');

    const updated = await app
      .patch(`/api/exams/${id}`)
      .set(alice.auth)
      .send({ confidence_level: 'high', preparation_percent: 60, topics: [] });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      confidence_level: 'high',
      preparation_percent: 60,
      topics: [],
    });

    const deleted = await app.delete(`/api/exams/${id}`).set(alice.auth);
    expect(deleted.status).toBe(200);
    expect(await db.rows('exams', { id })).toEqual([]);
  });

  it('returns 404 for an exam that does not exist', async () => {
    const app = db.api();
    const missing = '00000000-0000-4000-8000-000000000000';

    expect((await app.get(`/api/exams/${missing}`).set(alice.auth)).status).toBe(404);
    expect(
      (await app.patch(`/api/exams/${missing}`).set(alice.auth).send({ subject: 'x' })).status,
    ).toBe(404);
    expect((await app.delete(`/api/exams/${missing}`).set(alice.auth)).status).toBe(404);
  });
});
