/**
 * An error that is safe to show to the client. Anything else that reaches the
 * error handler is treated as internal and replaced with a generic message.
 */
class HttpError extends Error {
  /**
   * @param {number} status HTTP status code.
   * @param {string} message Client-safe message.
   */
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

/**
 * Map an Anthropic SDK error to a client-safe HttpError.
 * @param {any} err
 * @returns {HttpError}
 */
function fromAnthropicError(err) {
  if (err?.status === 401 || err?.status === 403) {
    return new HttpError(503, 'The AI service is not configured. Please try again later.');
  }
  if (err?.status === 429 || err?.status === 529) {
    return new HttpError(503, 'The AI service is busy. Please wait a moment and try again.');
  }
  if (err?.status === 413) {
    return new HttpError(413, 'The file is too large for AI processing. Try a smaller file.');
  }
  return new HttpError(502, 'The AI service failed to respond. Please try again.');
}

module.exports = { HttpError, fromAnthropicError };
