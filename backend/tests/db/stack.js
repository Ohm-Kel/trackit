/**
 * Locate the local Supabase stack the database tests run against. The values
 * come from the environment (set by scripts/db/integration.sh and CI) or,
 * failing that, from `supabase status` in the repository root.
 */
const { execFileSync } = require('child_process');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');
// Keep in step with scripts/db/integration.sh and the CI workflow.
const SUPABASE_CLI = 'supabase@2.121.0';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', 'host.docker.internal']);

function fromSupabaseStatus() {
  const run = (cmd, args) =>
    execFileSync(cmd, args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  let output;
  try {
    output = run('supabase', ['status', '-o', 'env']);
  } catch {
    try {
      output = run('npx', ['--yes', SUPABASE_CLI, 'status', '-o', 'env']);
    } catch {
      return {};
    }
  }
  const values = {};
  for (const line of output.split('\n')) {
    const match = /^([A-Z_]+)="?(.*?)"?$/.exec(line.trim());
    if (match) values[match[1]] = match[2];
  }
  return {
    SUPABASE_URL: values.API_URL,
    SUPABASE_SERVICE_KEY: values.SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: values.ANON_KEY,
  };
}

/** @returns {{ SUPABASE_URL: string, SUPABASE_SERVICE_KEY: string, SUPABASE_ANON_KEY: string }} */
function resolveStackEnv(env = process.env) {
  const keys = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_ANON_KEY'];
  const resolved = keys.every((key) => env[key])
    ? Object.fromEntries(keys.map((key) => [key, env[key]]))
    : fromSupabaseStatus();

  const missing = keys.filter((key) => !resolved[key]);
  if (missing.length > 0) {
    throw new Error(
      `No local Supabase stack found (missing ${missing.join(', ')}). ` +
        'Run scripts/db/integration.sh, or `supabase start` in the repository root.',
    );
  }
  assertLocal(resolved.SUPABASE_URL);
  return resolved;
}

/** These tests create and delete users: refuse to run against anything but a local stack. */
function assertLocal(url) {
  const { hostname } = new URL(url);
  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(`Refusing to run database tests against ${url}: only a local stack is allowed`);
  }
}

module.exports = { resolveStackEnv, assertLocal };
