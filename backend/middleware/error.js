const ErrorResponse = require('../utils/errorResponse');

/**
 * Global error handling middleware.
 * Catches all errors forwarded via next(err) from controllers.
 *
 * Handles:
 *  - Custom ErrorResponse (operational errors with known status codes)
 *  - Mongoose CastError (invalid ObjectId format)
 *  - Mongoose duplicate key error (code 11000)
 *  - Mongoose ValidationError (schema-level validation)
 *  - JWT errors (invalid / expired token)
 *  - Generic 500 fallback
 *
 * Response format is ALWAYS:
 *   { success: false, error: "Human-readable message" }
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log in development for debugging
    if (process.env.NODE_ENV === 'development') {
        console.error(`[ERROR] ${err.stack}`);
    }

    // Mongoose: Bad ObjectId (e.g., /api/properties/not-a-valid-id)
    if (err.name === 'CastError') {
        error = new ErrorResponse(`Resource not found with id: ${err.value}`, 404);
    }

    // Mongoose: Duplicate key (e.g., duplicate phone number)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const fieldLabels = { phone: 'Mobile number', email: 'Email address' };
        const label = fieldLabels[field] || field;
        error = new ErrorResponse(`${label} is already registered.`, 409);
    }

    // Mongoose: Schema validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        error = new ErrorResponse(messages.join('. '), 400);
    }

    // JWT: Token is malformed or tampered
    if (err.name === 'JsonWebTokenError') {
        error = new ErrorResponse('Invalid token. Please log in again.', 401);
    }

    // JWT: Token has expired
    if (err.name === 'TokenExpiredError') {
        error = new ErrorResponse('Session expired. Please log in again.', 401);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal Server Error',
    });
};

module.exports = errorHandler;
