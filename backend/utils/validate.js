const { validationResult } = require('express-validator');
const ErrorResponse = require('./errorResponse');

/**
 * Middleware to check express-validator results.
 * If validation fails, responds with a consistent field-level error format:
 *   { success: false, errors: [{ field: "phone", message: "..." }] }
 *
 * Place AFTER your express-validator chain and BEFORE the controller function.
 *
 * @example
 * router.post('/auth', [body('phone').isMobilePhone()], validate, controller)
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Map to { field, message } shape for the frontend inline display
        const formatted = errors.array().map((err) => ({
            field: err.path,
            message: err.msg,
        }));
        return res.status(422).json({ success: false, errors: formatted });
    }
    next();
};

module.exports = validate;
