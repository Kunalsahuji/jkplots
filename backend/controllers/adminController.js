const Admin = require('../models/Admin');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendTokenCookies, clearTokenCookies } = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// ─── Helper: sanitize admin ─────────────────────────────────────────────────
const sanitizeAdmin = (admin) => ({
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    permissions: admin.permissions,
});

// ─── @desc    Admin Login with Email & Password ──────────────────────────────
// ─── @route   POST /api/admin/login
// ─── @access  Public
exports.adminLogin = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Find admin and explicitly select password
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    if (!admin.isActive) {
        return next(new ErrorResponse('Admin account is deactivated', 403));
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Update lastLogin
    admin.lastLogin = new Date();
    await admin.save();

    // Use existing token generation from utils (same as users)
    sendTokenCookies(res, admin._id);

    res.status(200).json({
        success: true,
        message: 'Admin login successful',
        data: sanitizeAdmin(admin),
    });
});

// ─── @desc    Get Current Admin Profile ──────────────────────────────────────
// ─── @route   GET /api/admin/me
// ─── @access  Private (Admin)
exports.getAdminMe = asyncHandler(async (req, res, next) => {
    // req.user is populated by protect middleware
    if (!req.user || req.user.role !== 'admin' && req.user.role !== 'superadmin') {
         return next(new ErrorResponse('Not authorized as admin', 403));
    }

    res.status(200).json({
        success: true,
        data: sanitizeAdmin(req.user),
    });
});

// ─── @desc    Logout Admin ───────────────────────────────────────────────────
// ─── @route   POST /api/admin/logout
// ─── @access  Private
exports.adminLogout = asyncHandler(async (req, res, next) => {
    clearTokenCookies(res);
    res.status(200).json({
        success: true,
        message: 'Admin logged out successfully',
    });
});
