const express = require('express');
const router = express.Router();
const {
    getReviews,
    getMyReview,
    createReview,
    deleteMyReview,
    getAdminReviews,
    toggleReviewApproval,
    deleteReview
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(getReviews)
    .post(protect, createReview);

router.route('/me')
    .get(protect, getMyReview)
    .delete(protect, deleteMyReview);

router.route('/admin')
    .get(protect, authorize('admin', 'superadmin'), getAdminReviews);

router.route('/admin/:id')
    .delete(protect, authorize('admin', 'superadmin'), deleteReview);

router.route('/admin/:id/approve')
    .put(protect, authorize('admin', 'superadmin'), toggleReviewApproval);

module.exports = router;
