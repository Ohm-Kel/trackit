/**
 * The request path as it may be logged: without the query string, and with
 * calendar feed tokens replaced, since the token is the feed's credential.
 * @param {string} url
 * @returns {string}
 */
function logPath(url) {
  return url
    .split('?')[0]
    .replace(/\/calendar\/(?!export\.ics$)[^/]+\.ics$/, '/calendar/[token].ics');
}

module.exports = { logPath };
