const SystemConfig = require('../models/SystemConfig');
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
