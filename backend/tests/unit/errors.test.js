const { HttpError, fromAnthropicError } = require('../../lib/errors');
const { validate, throwIfDbError } = require('../../lib/validate');
const { z } = require('zod');

describe('fromAnthropicError', () => {
  it.each([
    [401, 503],
    [429, 503],
    [529, 503],
    [413, 413],
    [500, 502],
    [undefined, 502],
  ])('maps upstream %s to client-safe %s', (upstream, expected) => {
    const error = fromAnthropicError({ status: upstream, message: 'secret upstream detail' });
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(expected);
    expect(error.message).not.toContain('secret');
  });
});

describe('validate', () => {
  const schema = z.object({ title: z.string().min(1, 'Title is required') });

  it('returns parsed data', () => {
    expect(validate(schema, { title: 'x', extra: 1 })).toEqual({ title: 'x' });
  });

  it('throws a 400 naming the field', () => {
    expect(() => validate(schema, { title: '' })).toThrow('title: Title is required');
    try {
      validate(schema, {});
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });
});

describe('throwIfDbError', () => {
  it('turns PGRST116 into a 404 and rethrows other errors', () => {
    expect(() => throwIfDbError({ code: 'PGRST116' }, 'Task not found')).toThrow('Task not found');
    const dbError = { code: '23505', message: 'duplicate key' };
    expect(() => throwIfDbError(dbError)).toThrow(expect.objectContaining({ code: '23505' }));
    expect(() => throwIfDbError(null)).not.toThrow();
  });
});
