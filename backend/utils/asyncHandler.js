/**
 * Wraps async route handlers to forward errors to Express error middleware.
 * Eliminates repetitive try/catch blocks in every controller.
 *
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
