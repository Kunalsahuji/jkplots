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
        .matches(/^\+91[6-9]\d{9}$/).withMessage('Enter a valid mobile number starting with +91 followed by 10 digits starting with 6-9'),

    body('role')
        .optional()
        .isIn(['user', 'dealer', 'admin']).withMessage('Role must be either user, dealer, or admin'),
];

// Step 2: Verify OTP
exports.verifyOtpValidation = [
    body('phone')
        .trim()
        .notEmpty().withMessage('Mobile number is required')
        .matches(/^\+91[6-9]\d{9}$/).withMessage('Enter a valid mobile number starting with +91 followed by 10 digits starting with 6-9'),

    body('otp')
        .trim()
        .notEmpty().withMessage('OTP is required')
        .matches(/^\d{6}$/).withMessage('OTP must be exactly 6 digits'),
];
