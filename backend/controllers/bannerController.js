const Banner = require('../models/Banner');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all active banners (for public view)
// @route   GET /api/banners
// @access  Public
exports.getActiveBanners = async (req, res, next) => {
    try {
        const { placement } = req.query;
        let query = { isActive: true };
        
        if (placement) {
            query.placement = placement;
        }

        // Also check if current date is within start and end date if endDate exists
        query.$or = [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: new Date() } }
        ];

        const banners = await Banner.find(query).sort('-createdAt');

        res.status(200).json({
            success: true,
            count: banners.length,
            data: banners
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Track banner click
// @route   PUT /api/banners/:id/click
// @access  Public
exports.trackBannerClick = async (req, res, next) => {
    try {
        const banner = await Banner.findByIdAndUpdate(
            req.params.id,
            { $inc: { clicks: 1 } },
            { new: true, runValidators: true }
        );

        if (!banner) {
            return next(new ErrorResponse('Banner not found', 404));
        }

        res.status(200).json({
            success: true,
            data: banner
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all banners (Admin)
// @route   GET /api/banners/admin
// @access  Private/Admin
exports.getAdminBanners = async (req, res, next) => {
    try {
        const banners = await Banner.find().sort('-createdAt');

        res.status(200).json({
            success: true,
            count: banners.length,
            data: banners
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a banner
// @route   POST /api/banners/admin
// @access  Private/Admin
exports.createBanner = async (req, res, next) => {
    try {
        const banner = await Banner.create(req.body);

        res.status(201).json({
            success: true,
            data: banner
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a banner
// @route   PUT /api/banners/admin/:id
// @access  Private/Admin
exports.updateBanner = async (req, res, next) => {
    try {
        const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!banner) {
            return next(new ErrorResponse('Banner not found', 404));
        }

        res.status(200).json({
            success: true,
            data: banner
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a banner
// @route   DELETE /api/banners/admin/:id
// @access  Private/Admin
exports.deleteBanner = async (req, res, next) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return next(new ErrorResponse('Banner not found', 404));
        }

        await banner.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
