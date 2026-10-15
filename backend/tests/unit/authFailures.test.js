const authFailures = require('../../lib/authFailures');
const config = require('../../config');

beforeEach(() => authFailures.reset());

it('blocks an IP after the configured number of failures until the window ends', () => {
  const start = 1_000_000;
  for (let i = 0; i < config.rateLimit.authFailuresPerIp; i += 1) {
    expect(authFailures.retryAfterSeconds('10.0.0.1', start)).toBe(0);
    authFailures.recordFailure('10.0.0.1', start);
  }
  expect(authFailures.retryAfterSeconds('10.0.0.1', start)).toBe(15 * 60);
  // Other IPs are unaffected.
  expect(authFailures.retryAfterSeconds('10.0.0.2', start)).toBe(0);
  // The block lifts when the window ends.
  expect(authFailures.retryAfterSeconds('10.0.0.1', start + 15 * 60 * 1000)).toBe(0);
});

it('starts a fresh window after the old one expires', () => {
  authFailures.recordFailure('10.0.0.1', 0);
  authFailures.recordFailure('10.0.0.1', 15 * 60 * 1000 + 1);
  for (let i = 1; i < config.rateLimit.authFailuresPerIp; i += 1) {
    authFailures.recordFailure('10.0.0.1', 15 * 60 * 1000 + 2);
  }
  expect(authFailures.retryAfterSeconds('10.0.0.1', 15 * 60 * 1000 + 3)).toBeGreaterThan(0);
});
