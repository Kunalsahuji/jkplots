const SystemConfig = require('../models/SystemConfig');
const Property = require('../models/Property');
const User = require('../models/User');
const Review = require('../models/Review');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get system config
// @route   GET /api/system-config
// @access  Public
exports.getConfig = asyncHandler(async (req, res, next) => {
    let config = await SystemConfig.findOne();
    if (!config) {
        config = await SystemConfig.create({});
    }
    res.status(200).json({
        success: true,
        data: config
    });
});

// @desc    Update system config
// @route   PUT /api/system-config
// @access  Private/Admin
exports.updateConfig = asyncHandler(async (req, res, next) => {
    let config = await SystemConfig.findOne();
    if (!config) {
        config = await SystemConfig.create(req.body);
    } else {
        config = await SystemConfig.findOneAndUpdate({}, req.body, {
            new: true,
            runValidators: true
        });
    }

    res.status(200).json({
        success: true,
        data: config
    });
});

// @desc    Get platform public stats
// @route   GET /api/system-config/stats
// @access  Public
exports.getPlatformStats = asyncHandler(async (req, res, next) => {
    const [propertiesCount, dealersCount, usersCount, reviews] = await Promise.all([
        Property.countDocuments({ status: { $ne: 'Sold' } }),
        User.countDocuments({ role: 'dealer' }),
        User.countDocuments({ role: 'user' }),
        Review.find({ property: { $exists: false }, isApproved: true }).select('rating')
    ]);

    // Calculate average rating
    let avgRating = 4.8; // Default fallback
    if (reviews.length > 0) {
        const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
        avgRating = (sum / reviews.length).toFixed(1);
    }

    // Format numbers with K/M if needed, or just return raw numbers and format on frontend.
    // We will return raw numbers and let frontend format them nicely.
    res.status(200).json({
        success: true,
        data: {
            properties: propertiesCount || 120, // Add base numbers if db is empty for visual purposes
            dealers: dealersCount || 25,
            users: usersCount || 1500,
            rating: avgRating
        }
    });
});
