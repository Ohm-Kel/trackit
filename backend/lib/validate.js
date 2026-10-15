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

module.exports = { validate, throwIfDbError };
