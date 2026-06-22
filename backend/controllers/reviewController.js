const Review = require('../models/Review');
const Property = require('../models/Property');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get reviews
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
    try {
        const { propertyId, limit, page, rating, featured } = req.query;
        const query = { isApproved: true };

        if (featured === 'true') {
            query.rating = 5; // Get the best reviews
        } else {
            if (propertyId) {
                query.property = propertyId;
            } else {
                // General platform feedback (no property)
                query.property = { $exists: false };
            }
            if (rating) {
                query.rating = parseInt(rating, 10);
            }
        }

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

        const total = await Review.countDocuments(query);

        const reviews = await Review.find(query)
            .populate('user', 'name role')
            .sort('-createdAt')
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            count: reviews.length,
            pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
            data: reviews
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get user's own review for a property or platform
// @route   GET /api/reviews/me
// @access  Private
exports.getMyReview = async (req, res, next) => {
    try {
        const { propertyId } = req.query;
        let query = { user: req.user._id };

        if (propertyId) {
            query.property = propertyId;
        } else {
            query.property = { $exists: false };
        }

        const review = await Review.findOne(query);

        res.status(200).json({
            success: true,
            data: review || null
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete user's own review
// @route   DELETE /api/reviews/me
// @access  Private
exports.deleteMyReview = async (req, res, next) => {
    try {
        const { propertyId } = req.query;
        let query = { user: req.user._id };

        if (propertyId) {
            query.property = propertyId;
        } else {
            query.property = { $exists: false };
        }

        const review = await Review.findOne(query);
        
        if (!review) {
            return next(new ErrorResponse('Review not found', 404));
        }

        await review.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully',
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
    try {
        const { propertyId, rating, comment } = req.body;

        if (!rating || !comment) {
            return next(new ErrorResponse('Please provide a rating and a comment', 400));
        }

        const payload = {
            user: req.user._id,
            rating: parseInt(rating, 10),
            comment: comment.trim(),
        };

        if (propertyId) {
            const property = await Property.findById(propertyId);
            if (!property) {
                return next(new ErrorResponse('Property not found', 404));
            }
            payload.property = propertyId;
        }

        // Check if user already submitted a review for this target
        let existingReview;
        if (propertyId) {
            existingReview = await Review.findOne({ user: req.user._id, property: propertyId });
        } else {
            existingReview = await Review.findOne({ user: req.user._id, property: { $exists: false } });
        }

        if (existingReview) {
            // Update existing review (Upsert behavior)
            existingReview.rating = parseInt(rating, 10);
            existingReview.comment = comment.trim();
            // Automatically un-approve if it was edited so admin can re-verify (optional, leaving as is for now or setting to true based on previous logic where default is true)
            await existingReview.save();

            return res.status(200).json({
                success: true,
                message: "Review updated successfully",
                data: existingReview
            });
        }

        const review = await Review.create(payload);

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all reviews for Admin Panel
// @route   GET /api/reviews/admin
// @access  Private/Admin
exports.getAdminReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name phone email role')
            .populate('property', 'title')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Toggle review approval
// @route   PUT /api/reviews/admin/:id/approve
// @access  Private/Admin
exports.toggleReviewApproval = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return next(new ErrorResponse('Review not found', 404));
        }

        review.isApproved = !review.isApproved;
        await review.save();

        res.status(200).json({
            success: true,
            data: review
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/admin/:id
// @access  Private/Admin
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return next(new ErrorResponse('Review not found', 404));
        }

        await review.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully',
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
