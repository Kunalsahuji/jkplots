const express = require('express');
const router = express.Router();
const {
    getPlans,
    createOrder,
    verifyPayment,
    getAdminPlans,
    createPlan,
    updatePlan,
    deletePlan
} = require('../controllers/promotionController');
const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/plans', getPlans);

// Protected (Dealer)
router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

// Admin
router.get('/admin/plans', protect, authorize('admin', 'superadmin'), getAdminPlans);
router.post('/admin/plans', protect, authorize('admin', 'superadmin'), createPlan);
router.put('/admin/plans/:id', protect, authorize('admin', 'superadmin'), updatePlan);
router.delete('/admin/plans/:id', protect, authorize('admin', 'superadmin'), deletePlan);

module.exports = router;
