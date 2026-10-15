#!/usr/bin/env node
// Vercel installs the serverless function's dependencies from the root
// package.json, while local development and tests use backend/package.json.
// This check fails when the two runtime dependency lists drift apart.
const root = require('../package.json').dependencies || {};
const backend = require('../backend/package.json').dependencies || {};

const names = new Set([...Object.keys(root), ...Object.keys(backend)]);
const mismatches = [...names].filter((name) => root[name] !== backend[name]);

if (mismatches.length > 0) {
  process.stderr.write('Root and backend dependencies differ:\n');
  for (const name of mismatches) {
    process.stderr.write(`  ${name}: root=${root[name] ?? '-'} backend=${backend[name] ?? '-'}\n`);
  }
  process.exit(1);
}
process.stdout.write('Root and backend runtime dependencies are in sync.\n');
