const db = require('./helpers');

afterAll(db.deleteUsers);

const EMPTY_WEEK = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

describe('profile against the real database', () => {
  it('returns the profile the sign-up trigger created', async () => {
    const user = await db.createUser('new');
    const res = await db.api().get('/api/users/profile').set(user.auth);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: user.id,
      email: user.email,
      display_name: 'new Tester',
      weekly_schedule: null,
    });
  });

  it('recreates a missing profile row as the user', async () => {
    const user = await db.createUser('repair');
    const { error } = await db.service.from('users').delete().eq('id', user.id);
    if (error) throw error;

    const res = await db.api().get('/api/users/profile').set(user.auth);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: user.id,
      email: user.email,
      display_name: 'repair Tester',
    });
    expect(await db.rows('users', { id: user.id })).toHaveLength(1);
  });

  it('updates the profile', async () => {
    const user = await db.createUser('editor');
    const res = await db
      .api()
      .patch('/api/users/profile')
      .set(user.auth)
      .send({ display_name: 'Ed', university: 'UCL', year: '2', avatar_url: '' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: user.id,
      display_name: 'Ed',
      university: 'UCL',
      year: '2',
    });
    const [stored] = await db.rows('users', { id: user.id });
    expect(stored).toMatchObject({ display_name: 'Ed', university: 'UCL', email: user.email });
  });
});

describe('upload imports against the real database', () => {
  it('imports reviewed exams', async () => {
    const user = await db.createUser('importer');
    const res = await db
      .api()
      .post('/api/upload/import-exams')
      .set(user.auth)
      .send({
        exams: [
          { subject: 'Algebra', course_code: 'MATH 101', exam_date: '2026-12-01' },
          { subject: 'History', course_code: null, exam_date: '' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.imported).toBe(2);
    const stored = await db.rows('exams', { user_id: user.id });
    expect(stored.map((exam) => exam.subject).sort()).toEqual(['Algebra', 'History']);
    expect(stored.find((exam) => exam.subject === 'History')).toMatchObject({
      course_code: null,
      exam_date: null,
      confidence_level: 'medium',
      topics: [],
    });
  });

  it('saves the weekly schedule to the profile', async () => {
    const user = await db.createUser('scheduler');
    const schedule = {
      ...EMPTY_WEEK,
      monday: [{ start: '09:00', end: '10:30', subject: 'MATH 101', venue: 'Room 2' }],
    };

    const res = await db.api().post('/api/upload/save-schedule').set(user.auth).send({ schedule });
    expect(res.status).toBe(200);

    const profile = await db.api().get('/api/users/profile').set(user.auth);
    expect(profile.body.weekly_schedule).toEqual(schedule);
  });
});
