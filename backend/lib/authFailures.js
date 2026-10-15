const config = require('../config');

/**
 * Per-IP count of failed authentications (401s), in memory per instance.
 *
 * Only real failures are counted, so in-flight, aborted or successful
 * requests never add to it, and students sharing a campus IP are unaffected
 * by each other's normal use. Each bad token costs a Supabase Auth call, so
 * blocked IPs are rejected before that call and before their body is read.
 */
const failures = new Map();
let lastSweep = 0;

function windowMs() {
  return config.rateLimit.authFailureWindowMs;
}

function entry(ip, now) {
  const current = failures.get(ip);
  if (current && current.resetAt > now) return current;
  failures.delete(ip);
  return null;
}

/** Drop expired entries at most once per window, so the map stays bounded. */
function sweep(now) {
  if (now - lastSweep < windowMs()) return;
  lastSweep = now;
  for (const [ip, value] of failures) if (value.resetAt <= now) failures.delete(ip);
}

/** @returns {number} Seconds until the IP may retry, or 0 if it is not blocked. */
function retryAfterSeconds(ip, now = Date.now()) {
  const current = entry(ip, now);
  if (!current || current.count < config.rateLimit.authFailuresPerIp) return 0;
  return Math.ceil((current.resetAt - now) / 1000);
}

function recordFailure(ip, now = Date.now()) {
  sweep(now);
  const current = entry(ip, now) ?? { count: 0, resetAt: now + windowMs() };
  current.count += 1;
  failures.set(ip, current);
}

function reset() {
  failures.clear();
  lastSweep = 0;
}

/** Express middleware: reject an IP that has too many recent auth failures. */
function rejectBlockedIps(req, res, next) {
  const retryAfter = retryAfterSeconds(req.ip);
  if (retryAfter === 0) return next();
  res.set('Retry-After', String(retryAfter));
  return res
    .status(429)
    .json({ error: 'Too many failed sign-in attempts. Please try again later.' });
}

module.exports = { recordFailure, retryAfterSeconds, rejectBlockedIps, reset };
