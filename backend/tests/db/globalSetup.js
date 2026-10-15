const { resolveStackEnv } = require('./stack');

const HEALTH_TIMEOUT_MS = 60000;
const POLL_MS = 250;

/** Poll until `check` resolves true, or fail with the last error after the timeout. */
async function waitFor(name, check) {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  let lastError;
  while (Date.now() < deadline) {
    try {
      if (await check()) return;
    } catch (err) {
      lastError = err;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  throw new Error(`${name} did not become healthy: ${lastError?.message ?? 'timed out'}`);
}

/**
 * Point the API at the local stack and wait until GoTrue answers and
 * PostgREST has loaded the schema (it serves the tables the API queries).
 * Test workers inherit process.env from here.
 */
module.exports = async function globalSetup() {
  const env = resolveStackEnv();
  Object.assign(process.env, env, {
    NODE_ENV: 'test',
    // Never call Anthropic from these tests; lib/anthropic is mocked as well.
    ANTHROPIC_API_KEY: 'test-key-not-used',
  });

  const headers = { apikey: env.SUPABASE_SERVICE_KEY };
  await waitFor('GoTrue', async () => {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/health`, { headers });
    return res.ok;
  });
  await waitFor('PostgREST', async () => {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/tasks?select=completed_at&limit=1`, {
      headers: { ...headers, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return true;
  });
};
