/**
 * Custom error class for operational errors (client-facing).
 * Extends native Error to add HTTP status code.
 *
 * @example
 * throw new ErrorResponse('User not found', 404);
 * next(new ErrorResponse('Unauthorized', 401));
 */
class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;

        // Maintains proper stack trace in V8
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ErrorResponse;
