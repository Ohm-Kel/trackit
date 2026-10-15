const { z } = require('zod');

/**
 * Optional ISO date (YYYY-MM-DD, optionally followed by a time). HTML date
 * inputs send '' when cleared, which is stored as NULL rather than rejected.
 */
const optionalDate = z.preprocess(
  (value) => (value === '' ? null : value),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'must be an ISO date (YYYY-MM-DD)')
    .nullable()
    .optional(),
);

module.exports = { optionalDate };
