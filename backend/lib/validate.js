const { z } = require('zod');
const { HttpError } = require('./errors');

/**
 * Validate `data` against a Zod schema, throwing a 400 HttpError carrying the
 * first issue's message when it fails.
 * @template T
 * @param {import('zod').ZodType<T>} schema
 * @param {unknown} data
 * @returns {T}
 */
function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path?.length ? `${issue.path.join('.')}: ` : '';
    throw new HttpError(400, `${field}${issue?.message || 'Invalid request'}`);
  }
  return result.data;
}

/**
 * Throw a 404 when a Supabase `.single()` query found no row (PGRST116),
 * otherwise rethrow the database error for the central handler.
 * @param {{ code?: string } | null} error
 * @param {string} notFoundMessage
 */
function throwIfDbError(error, notFoundMessage = 'Not found') {
  if (!error) return;
  if (error.code === 'PGRST116') throw new HttpError(404, notFoundMessage);
  throw error;
}

// Any 8-4-4-4-12 hex string, which is what a Postgres uuid column accepts.
const idSchema = z.guid();

/**
 * Return the `:id` route parameter, or throw a 404 if it is not a UUID. No row
 * can have such an id, and querying with it makes Postgres fail the cast,
 * which would surface as a 500.
 * @param {string} id
 * @param {string} notFoundMessage
 * @returns {string}
 */
function parseId(id, notFoundMessage = 'Not found') {
  if (!idSchema.safeParse(id).success) throw new HttpError(404, notFoundMessage);
  return id;
}

module.exports = { validate, throwIfDbError, parseId };
