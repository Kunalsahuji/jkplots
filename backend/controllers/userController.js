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
    panNumber: user.panNumber,
    panName: user.panName,
    kycStatus: user.kycStatus,
    bio: user.bio || '',
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
    const Admin = require('../models/Admin');
    const [users, admins] = await Promise.all([
        User.find({}).sort('-createdAt'),
        Admin.find({}).sort('-createdAt')
    ]);

    const sanitizedUsers = users.map(u => ({
        id: u._id,
        _id: u._id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        role: u.role || 'user',
        kycStatus: u.kycStatus,
        panNumber: u.panNumber,
        panName: u.panName,
        isActive: u.isActive !== false,
        createdAt: u.createdAt
    }));

    const sanitizedAdmins = admins.map(a => ({
        id: a._id,
        _id: a._id,
        name: a.name,
        phone: a.phone,
        email: a.email,
        role: a.role || 'admin',
        kycStatus: 'approved',
        isActive: a.isActive !== false,
        createdAt: a.createdAt
    }));

    const combined = [...sanitizedAdmins, ...sanitizedUsers];

    res.status(200).json({
        success: true,
        count: combined.length,
        data: combined,
    });
});

// ─── @desc    Toggle save / unsave a property ─────────────────────────────────
// ─── @route   POST /api/users/save-property/:propertyId
// ─── @access  Private
exports.toggleSaveProperty = asyncHandler(async (req, res, next) => {
    const { propertyId } = req.params;
    const user = await User.findById(req.user.id);
    const Property = require('../models/Property');

    const idx = user.savedProperties.findIndex(id => id.toString() === propertyId);
    let saved;
    if (idx === -1) {
        user.savedProperties.push(propertyId);
        saved = true;
        await Property.findByIdAndUpdate(propertyId, { $inc: { likes: 1 } });
    } else {
        user.savedProperties.splice(idx, 1);
        saved = false;
        await Property.findByIdAndUpdate(propertyId, { $inc: { likes: -1 } });
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
    const { name, bio } = req.body;
    if (!name || name.trim().length < 2) {
        return next(new ErrorResponse('Name must be at least 2 characters', 400));
    }
    const user = await User.findById(req.user.id);
    user.name = name.trim();
    if (bio !== undefined) {
        user.bio = bio.trim();
    }
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
        success: true,
        data: sanitizeUser(user),
        message: 'Profile updated successfully',
    });
});
// ─── @desc    Initiate KYC (Send OTP) ────────────────────────────────────────
// ─── @route   POST /api/users/kyc/initiate
// ─── @access  Private (Dealer)
exports.initiateKYC = asyncHandler(async (req, res, next) => {
    const { panNumber, panName } = req.body;
    
    if (!panNumber || !panName) {
        return next(new ErrorResponse('Please provide PAN Number and Name on PAN', 400));
    }

    const user = await User.findById(req.user.id);
    
    // Save details in pending state
    user.panNumber = panNumber.toUpperCase();
    user.panName = panName;
    user.kycStatus = 'pending';
    
    // Set OTP
    user.otp = { code: HARDCODED_OTP, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
        success: true,
        message: 'KYC Details saved. OTP sent to registered mobile number for verification.',
        data: sanitizeUser(user)
    });
});

// ─── @desc    Verify KYC OTP and Approve ─────────────────────────────────────
// ─── @route   POST /api/users/kyc/verify
// ─── @access  Private (Dealer)
exports.verifyKYCOTP = asyncHandler(async (req, res, next) => {
    const { otp } = req.body;

    const user = await User.findById(req.user.id).select('+otp.code +otp.expiresAt');

    if (!user.otp || !user.otp.code) {
        return next(new ErrorResponse('No OTP request found. Please initiate KYC again.', 400));
    }

    if (user.otp.expiresAt < Date.now()) {
        user.otp = undefined;
        await user.save({ validateModifiedOnly: true });
        return next(new ErrorResponse('OTP expired. Please request a new one.', 400));
    }

    if (user.otp.code !== otp) {
        return next(new ErrorResponse('Invalid OTP', 400));
    }

    // OTP Verified! Simulate automated verification
    // (If the PAN was "FAILX1234X", we reject it for testing)
    if (user.panNumber === 'FAILX1234X') {
        user.kycStatus = 'rejected';
    } else {
        user.kycStatus = 'approved';
        
        // Find all properties of this dealer and mark them verified
        const Property = require('../models/Property');
        await Property.updateMany({ dealer: user._id }, { $set: { verified: true } });
    }

    // Clear OTP
    user.otp = undefined;
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
        success: true,
        message: user.kycStatus === 'approved' ? 'KYC Verified successfully!' : 'KYC Rejected. Invalid details.',
        data: sanitizeUser(user)
    });
});

// @desc    Admin update user details (role, KYC, isActive)
// @route   PUT /api/users/:id
// @access  Private (Admin/Superadmin)
exports.adminUpdateUser = asyncHandler(async (req, res, next) => {
    const { role, kycStatus, isActive } = req.body;
    const Admin = require('../models/Admin');

    let user = await User.findById(req.params.id);
    let isAdmin = false;

    if (!user) {
        user = await Admin.findById(req.params.id);
        if (!user) {
            return next(new ErrorResponse('User/Admin not found', 404));
        }
        isAdmin = true;
    }

    if (role !== undefined) user.role = role;
    
    if (kycStatus !== undefined) {
        user.kycStatus = kycStatus;
        if (kycStatus === 'approved') {
            const Property = require('../models/Property');
            await Property.updateMany({ dealer: user._id }, { $set: { verified: true } });
        }
    }
    
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: {
            id: user._id,
            _id: user._id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            kycStatus: isAdmin ? 'approved' : user.kycStatus,
            panNumber: user.panNumber,
            panName: user.panName,
            isActive: user.isActive !== false,
            createdAt: user.createdAt
        }
    });
});

// ─── @desc    Create new user, dealer, or admin (Admin only) ──────────────────
// ─── @route   POST /api/users
// ─── @access  Private (Admin)
exports.createUser = asyncHandler(async (req, res, next) => {
    const { name, email, phone, role, password } = req.body;
    const Admin = require('../models/Admin');

    if (!name || !phone) {
        return next(new ErrorResponse('Please provide a name and phone number', 400));
    }

    const formattedPhone = `+91${phone.replace(/\D/g, '').slice(-10)}`;

    if (role === 'admin' || role === 'superadmin') {
        if (!email || !password) {
            return next(new ErrorResponse('Please provide email and password for admin accounts', 400));
        }

        const existingAdmin = await Admin.findOne({ $or: [{ email }, { phone: formattedPhone }] });
        if (existingAdmin) {
            return next(new ErrorResponse('An admin with this email or phone already exists', 400));
        }

        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = await Admin.create({
            name,
            email,
            phone: formattedPhone,
            role: role || 'admin',
            password: hashedPassword
        });

        return res.status(201).json({
            success: true,
            message: 'Admin account created successfully',
            data: {
                id: newAdmin._id,
                _id: newAdmin._id,
                name: newAdmin.name,
                phone: newAdmin.phone,
                email: newAdmin.email,
                role: newAdmin.role,
                kycStatus: 'approved',
                isActive: true,
                createdAt: newAdmin.createdAt
            }
        });
    } else {
        const existingUser = await User.findOne({ phone: formattedPhone });
        if (existingUser) {
            return next(new ErrorResponse('A user with this phone number already exists', 400));
        }

        const newUser = await User.create({
            name,
            phone: formattedPhone,
            role: role || 'user',
            email: email || undefined,
            kycStatus: role === 'dealer' ? 'pending' : 'unverified'
        });

        return res.status(201).json({
            success: true,
            message: 'User account created successfully',
            data: {
                id: newUser._id,
                _id: newUser._id,
                name: newUser.name,
                phone: newUser.phone,
                email: newUser.email,
                role: newUser.role,
                kycStatus: newUser.kycStatus,
                isActive: true,
                createdAt: newUser.createdAt
            }
        });
    }
});

// ─── @desc    Delete user or admin (Admin only) ──────────────────────────────
// ─── @route   DELETE /api/users/:id
// ─── @access  Private (Admin)
exports.deleteUser = asyncHandler(async (req, res, next) => {
    const Admin = require('../models/Admin');
    const Property = require('../models/Property');
    const Enquiry = require('../models/Enquiry');

    let user = await User.findById(req.params.id);
    let isAdmin = false;

    if (!user) {
        user = await Admin.findById(req.params.id);
        if (!user) {
            return next(new ErrorResponse('User/Admin not found', 404));
        }
        isAdmin = true;
    }

    // Prevent deleting oneself
    if (user._id.toString() === req.user.id.toString()) {
        return next(new ErrorResponse('You cannot delete your own account', 400));
    }

    if (isAdmin) {
        await Admin.findByIdAndDelete(req.params.id);
    } else {
        // Delete all properties posted by this dealer
        await Property.deleteMany({ dealer: user._id });
        // Delete all enquiries buyer sent or dealer received
        await Enquiry.deleteMany({
            $or: [
                { buyer: user._id },
                { dealer: user._id }
            ]
        });
        await User.findByIdAndDelete(req.params.id);
    }

    res.status(200).json({
        success: true,
        message: 'Account and associated listings deleted successfully'
    });
});

// ─── @desc    Get public dealer details with listings ─────────────────────────
// ─── @route   GET /api/users/dealers/:id
// ─── @access  Public
exports.getPublicDealer = asyncHandler(async (req, res, next) => {
    const dealer = await User.findOne({ _id: req.params.id, role: 'dealer' });
    if (!dealer) {
        return next(new ErrorResponse('Dealer profile not found', 404));
    }

    const Property = require('../models/Property');
    const properties = await Property.find({ 
        $or: [
            { dealer: dealer._id },
            { dealerPhone: dealer.phone }
        ]
    }).sort('-createdAt');

    // Calculate rating score
    const totalReviews = properties.reduce((acc, curr) => acc + (curr.reviews?.length || 0), 0);
    const sumRatings = properties.reduce((acc, curr) => {
        const propSum = curr.reviews?.reduce((s, r) => s + r.rating, 0) || 0;
        return acc + propSum;
    }, 0);
    const ratingScore = totalReviews > 0 ? (sumRatings / totalReviews).toFixed(1) : "5.0";

    res.status(200).json({
        success: true,
        data: {
            id: dealer._id,
            name: dealer.name,
            phone: dealer.phone,
            kycStatus: dealer.kycStatus,
            bio: dealer.bio || `Registered professional real estate dealer at JKPlot. Helping you find properties in Jammu and Kashmir.`,
            ratingScore,
            totalProperties: properties.length,
            properties
        }
    });
});

// ─── @desc    Get all public dealers ──────────────────────────────────────────
// ─── @route   GET /api/users/dealers
// ─── @access  Public
exports.getPublicDealers = asyncHandler(async (req, res, next) => {
    const dealers = await User.find({ role: 'dealer' });
    const Property = require('../models/Property');

    const result = [];
    for (const dealer of dealers) {
        const properties = await Property.find({ 
            $or: [
                { dealer: dealer._id },
                { dealerPhone: dealer.phone }
            ]
        });

        // Calculate rating score
        const totalReviews = properties.reduce((acc, curr) => acc + (curr.reviews?.length || 0), 0);
        const sumRatings = properties.reduce((acc, curr) => {
            const propSum = curr.reviews?.reduce((s, r) => s + r.rating, 0) || 0;
            return acc + propSum;
        }, 0);
        const ratingScore = totalReviews > 0 ? (sumRatings / totalReviews).toFixed(1) : "5.0";

        // Check if dealer has featured listings
        const hasFeatured = properties.some(p => p.isFeatured && (!p.featuredUntil || p.featuredUntil > Date.now()));

        result.push({
            id: dealer._id,
            name: dealer.name,
            phone: dealer.phone,
            kycStatus: dealer.kycStatus,
            bio: dealer.bio || `Registered professional real estate dealer at JKPlot. Helping you find properties in Jammu and Kashmir.`,
            ratingScore,
            totalProperties: properties.length,
            hasFeatured
        });
    }

    res.status(200).json({
        success: true,
        data: result
    });
});
