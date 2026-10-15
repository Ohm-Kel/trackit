/**
 * Minimal stand-in for the Supabase JS client used by the controllers.
 *
 * Each `from(table)` call returns a chainable query builder that records every
 * method call and, when awaited, resolves to the next queued result for that
 * table. Tests queue results with `queue(table, result)` and inspect calls
 * with `queries(table)` to assert, for example, that `.eq('user_id', …)` was
 * applied.
 */
function createSupabaseMock() {
  const pending = new Map();
  const log = [];

  const getUser = jest.fn();

  function queue(table, result) {
    if (!pending.has(table)) pending.set(table, []);
    pending.get(table).push({ data: null, error: null, ...result });
  }

  function from(table) {
    const calls = [];
    log.push({ table, calls });

    const builder = new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === 'then') {
            const next = pending.get(table)?.shift() ?? { data: [], error: null };
            return (resolve, reject) => Promise.resolve(next).then(resolve, reject);
          }
          return (...args) => {
            calls.push([prop, ...args]);
            return builder;
          };
        },
      },
    );
    return builder;
  }

  function queries(table) {
    return log.filter((entry) => entry.table === table).map((entry) => entry.calls);
  }

  function reset() {
    pending.clear();
    log.length = 0;
    getUser.mockReset();
  }

  return { client: { from: jest.fn(from), auth: { getUser } }, queue, queries, reset, getUser };
}

/** Helper: does a recorded call list contain `.method(...args)`? */
function hasCall(calls, method, ...args) {
  return calls.some(
    ([name, ...callArgs]) =>
      name === method && args.every((arg, index) => Object.is(callArgs[index], arg)),
  );
}

module.exports = { createSupabaseMock, hasCall };
