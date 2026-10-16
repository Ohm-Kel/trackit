const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://project.supabase.co';

/** Load the module fresh with the given environment. */
function load(env) {
  let mod;
  let serviceClient;
  jest.isolateModules(() => {
    Object.assign(process.env, { SUPABASE_URL, SUPABASE_SERVICE_KEY: 'service-key', ...env });
    serviceClient = require('../../supabaseClient');
    mod = require('../../supabaseUserClient');
  });
  return { ...mod, serviceClient };
}

const realFetch = global.fetch;
afterEach(() => {
  global.fetch = realFetch;
  delete process.env.SUPABASE_ANON_KEY;
});

it('sends queries with the anon key and the user’s token, so RLS applies', async () => {
  global.fetch = jest.fn(
    async () =>
      new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }),
  );
  const { createUserClient, serviceClient } = load({ SUPABASE_ANON_KEY: 'anon-key' });

  const db = createUserClient('user-jwt');
  expect(db).not.toBe(serviceClient);
  await db.from('tasks').select('id');

  const [url, init] = global.fetch.mock.calls[0];
  const headers = new Headers(init.headers);
  expect(String(url)).toContain(`${SUPABASE_URL}/rest/v1/tasks`);
  expect(headers.get('authorization')).toBe('Bearer user-jwt');
  expect(headers.get('apikey')).toBe('anon-key');
});

it('falls back to the service-role client when no anon key is configured', () => {
  const { createUserClient, serviceClient } = load({});
  expect(createUserClient('user-jwt')).toBe(serviceClient);
});

it('keeps the service-role client out of request handlers', () => {
  // Handlers must query through req.db; only auth and rate limiting may use
  // the service role.
  const dir = path.join(__dirname, '../../controllers');
  for (const file of fs.readdirSync(dir)) {
    const source = fs.readFileSync(path.join(dir, file), 'utf8');
    expect({ file, importsServiceClient: source.includes('supabaseClient') }).toEqual({
      file,
      importsServiceClient: false,
    });
  }
});
