// Integration tests against a real local Supabase stack (Postgres, PostgREST,
// GoTrue). Run with `npm run test:db`; see docs/adr/0008-real-database-integration-tests.md.
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/db'],
  testMatch: ['**/*.test.js'],
  globalSetup: '<rootDir>/tests/db/globalSetup.js',
  // Real network round trips; generous enough for a cold CI runner.
  testTimeout: 30000,
};
