const express = require('express');
const router = express.Router();
const {
    createTransaction,
    verifyPayment,
    getAdminTransactions,
    getMyTransactions,
    updateTransactionStatus
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

// All transaction routes require authentication
router.use(protect);

// Create order / transaction
router.post('/', createTransaction);

// Verify Razorpay payment
router.post('/verify', verifyPayment);

// Get my transactions
router.get('/my-transactions', getMyTransactions);

// Admin routes
router.get('/admin', authorize('admin', 'superadmin'), getAdminTransactions);
router.put('/admin/:id', authorize('admin', 'superadmin'), updateTransactionStatus);

module.exports = router;
