const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendTokenCookies, clearTokenCookies } = require('../utils/generateToken');

// ─── Hardcoded OTP constant ──────────────────────────────────────────────────
// TODO: Replace with real SMS OTP (MSG91 / 2Factor) after purchasing SMS credits.
// When replacing: generate random 6-digit code, hash with bcrypt, store in user.otp.code
// with user.otp.expiresAt = Date.now() + 10 * 60 * 1000 (10 min expiry)
const HARDCODED_OTP = '123456';

// ─── Helper: safe user object (no sensitive fields) ───────────────────────────
const sanitizeUser = (user) => ({
    id: user._id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    savedProperties: user.savedProperties,
    createdAt: user.createdAt,
});

// ─── @desc    Step 1 — Validate details, "send" OTP ──────────────────────────
// ─── @route   POST /api/users/send-otp
// ─── @access  Public
exports.sendOtp = asyncHandler(async (req, res, next) => {
    const { phone, name, role } = req.body;
    const targetRole = role || 'user';

    // Upsert: check user if exists
    let user = await User.findOne({ phone });

    if (user) {
        // Strict Role Check: prevent logging in with the wrong profile role
        if (user.role !== targetRole) {
            return next(
                new ErrorResponse(
                    `This mobile number is already registered as a ${user.role}. Please log in as a ${user.role}.`,
                    400
                )
            );
        }

        // Update name if provided (user might be correcting their name)
        user.name = name || user.name;
        // Store OTP on user document (for future real OTP: hash + expiry here)
        user.otp = { code: HARDCODED_OTP, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
        await user.save({ validateModifiedOnly: true });
    } else {
        // New registration
        user = await User.create({
            phone,
            name,
            role: targetRole,
            otp: { code: HARDCODED_OTP, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
        });
    }

    // TODO: Call SMS provider here to deliver the real OTP to `phone`
    // await sendSMS(phone, `Your JKPlot OTP is ${otp}. Valid for 10 minutes.`);

    res.status(200).json({
        success: true,
        message: `OTP sent to${phone}`,
        // In production, never return the OTP in the response
        // This is only for development until SMS is integrated
        ...(process.env.NODE_ENV === 'development' && { devOtp: HARDCODED_OTP }),
    });
});

// ─── @desc    Step 2 — Verify OTP, issue JWT cookies ─────────────────────────
// ─── @route   POST /api/users/verify-otp
// ─── @access  Public
exports.verifyOtp = asyncHandler(async (req, res, next) => {
    const { phone, otp } = req.body;

    // Find user (include otp field which is select: false in schema)
    const user = await User.findOne({ phone }).select('+otp.code +otp.expiresAt');

    if (!user) {
        return next(new ErrorResponse('No account found for this number. Please request a new OTP.', 404));
    }

    // Check OTP validity
    // TODO: When real SMS OTP is implemented, replace with:
    //   if (!user.otp?.code || user.otp.code !== otp || user.otp.expiresAt < Date.now())
    if (String(otp) !== HARDCODED_OTP) {
        return next(new ErrorResponse('Incorrect OTP. Please try again.', 400));
    }

    // Check OTP expiry (10 minutes)
    if (String(otp) !== HARDCODED_OTP && user.otp?.expiresAt && user.otp.expiresAt < Date.now()) {
        return next(new ErrorResponse('OTP has expired. Please request a new one.', 400));
    }

    if (!user.isActive) {
        return next(new ErrorResponse('Your account has been deactivated. Contact support.', 403));
    }

    // Clear the used OTP
    user.otp = undefined;
    await user.save({ validateModifiedOnly: true });

    // Issue JWT access + refresh tokens as httpOnly cookies
    sendTokenCookies(res, user._id);

    res.status(200).json({
        success: true,
        data: sanitizeUser(user),
    });
});

// ─── @desc    Get current logged-in user ─────────────────────────────────────
// ─── @route   GET /api/users/me
// ─── @access  Private (requires JWT)
exports.getMe = asyncHandler(async (req, res, next) => {
    // req.user is attached by the protect middleware
    res.status(200).json({
        success: true,
        data: sanitizeUser(req.user),
    });
});

// ─── @desc    Logout — clear auth cookies ────────────────────────────────────
// ─── @route   POST /api/users/logout
// ─── @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
    clearTokenCookies(res);

    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
});

// ─── @desc    Get all users (Admin only) ─────────────────────────────────────
// ─── @route   GET /api/users
// ─── @access  Private (Admin)
exports.getUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find({}).sort('-createdAt');
    res.status(200).json({
        success: true,
        count: users.length,
        data: users.map(sanitizeUser),
    });
});

// ─── @desc    Toggle save / unsave a property ─────────────────────────────────
// ─── @route   POST /api/users/save-property/:propertyId
// ─── @access  Private
exports.toggleSaveProperty = asyncHandler(async (req, res, next) => {
    const { propertyId } = req.params;
    const user = await User.findById(req.user.id);

    const idx = user.savedProperties.findIndex(id => id.toString() === propertyId);
    let saved;
    if (idx === -1) {
        user.savedProperties.push(propertyId);
        saved = true;
    } else {
        user.savedProperties.splice(idx, 1);
        saved = false;
    }
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
        success: true,
        saved,
        savedProperties: user.savedProperties,
        message: saved ? 'Property saved to shortlist' : 'Property removed from shortlist',
    });
});

// ─── @desc    Update current user profile (name) ─────────────────────────────
// ─── @route   PUT /api/users/me
// ─── @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
        return next(new ErrorResponse('Name must be at least 2 characters', 400));
    }
    const user = await User.findById(req.user.id);
    user.name = name.trim();
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
        success: true,
        data: sanitizeUser(user),
        message: 'Profile updated successfully',
    });
});
