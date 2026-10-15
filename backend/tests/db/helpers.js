/**
 * Shared setup for the real-database tests: the API runs unmodified against
 * the local Supabase stack, with real users and real JWTs. Only Anthropic is
 * replaced with a fake.
 *
 * Usage (at the top of a test file, before requiring anything else):
 *   const db = require('./helpers');
 */
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const mockAnthropic = { messages: { create: jest.fn(), stream: jest.fn() } };
jest.mock('../../lib/anthropic', () => mockAnthropic);

const request = require('supertest');
const config = require('../../config');
const { assertLocal } = require('./stack');

assertLocal(config.supabaseUrl);

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

/** Service-role client for test setup and for checking what the API wrote. */
const service = createClient(config.supabaseUrl, config.supabaseServiceKey, clientOptions);

const createdUserIds = [];

/**
 * Create a confirmed user through the GoTrue admin API, then sign in with a
 * password to get a real access token, as the frontend does.
 * @param {string} name Used in the email address and display name.
 */
async function createUser(name) {
  const email = `${name}-${crypto.randomUUID()}@example.test`;
  const password = `Pw-${crypto.randomUUID()}`;
  const { data: created, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `${name} Tester` },
  });
  if (error) throw error;
  createdUserIds.push(created.user.id);

  const anon = createClient(config.supabaseUrl, config.supabaseAnonKey, clientOptions);
  const { data: session, error: signInError } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  const token = session.session.access_token;
  return { id: created.user.id, email, token, auth: { Authorization: `Bearer ${token}` } };
}

/** Delete every user this file created; their rows go with them (ON DELETE CASCADE). */
async function deleteUsers() {
  const ids = createdUserIds.splice(0);
  await Promise.all(ids.map((id) => service.auth.admin.deleteUser(id)));
}

/** Read rows as the service role, failing the test on a database error. */
async function rows(table, filters = {}) {
  let query = service.from(table).select('*');
  for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/** A fresh app instance, as a new serverless invocation would build it. */
function api() {
  const { createApp } = require('../../app');
  return request(createApp());
}

/**
 * An app built from a separate copy of every module, so it shares nothing in
 * memory with other instances (rate-limit stores included), like a second
 * serverless instance.
 */
function isolatedApi() {
  let createApp;
  jest.isolateModules(() => {
    ({ createApp } = require('../../app'));
  });
  return request(createApp());
}

/** An ISO timestamp `hours` from now (negative for the past). */
function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

module.exports = {
  anthropic: mockAnthropic,
  service,
  createUser,
  deleteUsers,
  rows,
  api,
  isolatedApi,
  hoursFromNow,
};
