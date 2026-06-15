const Review = require('../models/Review');
const Property = require('../models/Property');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get reviews
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
    try {
        const { propertyId, limit } = req.query;
        const query = { isApproved: true };

        if (propertyId) {
            query.property = propertyId;
        } else {
            // General platform feedback (no property)
            query.property = { $exists: false };
        }

        let dbQuery = Review.find(query)
            .populate('user', 'name role')
            .sort('-createdAt');

        if (limit) {
            dbQuery = dbQuery.limit(parseInt(limit, 10));
        }

        const reviews = await dbQuery;

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
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
