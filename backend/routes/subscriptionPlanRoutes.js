const express = require('express');
const router = express.Router();
const {
    getActivePlans,
    getAllPlans,
    createPlan,
    updatePlan,
    deletePlan,
    getMySubscription,
    createSubscriptionOrder,
    verifySubscriptionPayment
} = require('../controllers/subscriptionPlanController');
const { protect, authorize } = require('../middleware/auth');

// Public/User routes
router.get('/active', getActivePlans);

// Protected Dealer routes
router.get('/my-subscription', protect, getMySubscription);
router.post('/create-order', protect, createSubscriptionOrder);
router.post('/verify-payment', protect, verifySubscriptionPayment);

// Admin routes
router.route('/')
    .get(protect, authorize('admin'), getAllPlans)
    .post(protect, authorize('admin'), createPlan);

router.route('/:id')
    .put(protect, authorize('admin'), updatePlan)
    .delete(protect, authorize('admin'), deletePlan);

module.exports = router;
