/**
 * Shared setup for API tests: replaces Supabase and Anthropic with fakes and
 * signs requests in as a fixed test user.
 *
 * Usage (at the top of a test file, before requiring anything else):
 *   const ctx = require('../helpers/app');
 */
const { createSupabaseMock } = require('./supabaseMock');

const USER = { id: '11111111-1111-4111-8111-111111111111', email: 'student@example.com' };
const TOKEN = 'test-token';

const mockSupabase = createSupabaseMock();
const mockAnthropic = { messages: { create: jest.fn() } };

jest.mock('../../supabaseClient', () => mockSupabase.client);
jest.mock('../../lib/anthropic', () => mockAnthropic);

const request = require('supertest');
const { createApp } = require('../../app');

function signIn() {
  mockSupabase.getUser.mockImplementation(async (token) =>
    token === TOKEN
      ? { data: { user: USER }, error: null }
      : { data: { user: null }, error: { message: 'invalid JWT' } },
  );
}

function resetMocks() {
  mockSupabase.reset();
  mockAnthropic.messages.create.mockReset();
  signIn();
}

/** Build a request client for a fresh app instance. */
function api() {
  return request(createApp());
}

const auth = { Authorization: `Bearer ${TOKEN}` };

module.exports = {
  USER,
  TOKEN,
  auth,
  supabase: mockSupabase,
  anthropic: mockAnthropic,
  resetMocks,
  api,
};
