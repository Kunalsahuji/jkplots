const express = require('express');
const router = express.Router();

const {
    sendOtp,
    verifyOtp,
    getMe,
    logout,
    getUsers,
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');
const { sendOtpValidation, verifyOtpValidation } = require('../middleware/userValidation');
const validate = require('../utils/validate');

// ─── Public routes ────────────────────────────────────────────────────────────
router.post('/send-otp', sendOtpValidation, validate, sendOtp);
router.post('/verify-otp', verifyOtpValidation, validate, verifyOtp);

// ─── Protected routes (JWT required) ─────────────────────────────────────────
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.get('/', protect, authorize('admin'), getUsers);

module.exports = router;
