const { body } = require('express-validator');

/**
 * Validation chains for user-related routes.
 * Keeps route files clean — all validation rules live here.
 */

// Step 1: Send OTP (name + phone + optional role)
exports.sendOtpValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters')
        .matches(/^[A-Za-z\s]+$/).withMessage('Name must contain only letters and spaces'),

    body('phone')
        .trim()
        .notEmpty().withMessage('Mobile number is required')
        .matches(/^\d{10}$/).withMessage('Enter a valid 10-digit mobile number'),

    body('role')
        .optional()
        .isIn(['user', 'dealer']).withMessage('Role must be either user or dealer'),
];

// Step 2: Verify OTP
exports.verifyOtpValidation = [
    body('phone')
        .trim()
        .notEmpty().withMessage('Mobile number is required')
        .matches(/^\d{10}$/).withMessage('Enter a valid 10-digit mobile number'),

    body('otp')
        .trim()
        .notEmpty().withMessage('OTP is required')
        .matches(/^\d{6}$/).withMessage('OTP must be exactly 6 digits'),
];
