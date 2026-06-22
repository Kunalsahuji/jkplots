const Transaction = require('../models/Transaction');
const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const PromotionPlan = require('../models/PromotionPlan');
const Property = require('../models/Property');
const ErrorResponse = require('../utils/errorResponse');
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

// @desc    Create a new transaction order
// @route   POST /api/transactions
// @access  Private (Dealer)
exports.createTransaction = async (req, res, next) => {
    try {
        const { itemType, subscriptionPlanId, promotionPlanId, propertyId, paymentMethod } = req.body;

        if (!['Subscription', 'Promotion'].includes(itemType)) {
            return next(new ErrorResponse('Invalid itemType', 400));
        }
        if (!['Razorpay', 'Offline'].includes(paymentMethod)) {
            return next(new ErrorResponse('Invalid paymentMethod', 400));
        }

        let amount = 0;
        let planDoc = null;

        if (itemType === 'Subscription') {
            if (!subscriptionPlanId) return next(new ErrorResponse('subscriptionPlanId is required', 400));
            planDoc = await SubscriptionPlan.findById(subscriptionPlanId);
            if (!planDoc) return next(new ErrorResponse('Subscription plan not found', 404));
            amount = planDoc.price;
        } else {
            if (!promotionPlanId || !propertyId) return next(new ErrorResponse('promotionPlanId and propertyId are required', 400));
            planDoc = await PromotionPlan.findById(promotionPlanId);
            if (!planDoc) return next(new ErrorResponse('Promotion plan not found', 404));
            amount = planDoc.price;
            
            const property = await Property.findById(propertyId);
            if (!property || property.dealer.toString() !== req.user._id.toString()) {
                return next(new ErrorResponse('Property not found or unauthorized', 404));
            }
        }

        const transactionData = {
            itemType,
            dealer: req.user._id,
            amount,
            paymentMethod,
            status: 'Pending'
        };

        if (itemType === 'Subscription') {
            transactionData.subscriptionPlan = subscriptionPlanId;
        } else {
            transactionData.promotionPlan = promotionPlanId;
            transactionData.property = propertyId;
        }

        // Handle Razorpay
        if (paymentMethod === 'Razorpay') {
            const options = {
                amount: amount * 100, // in paise
                currency: 'INR',
                receipt: `rcpt_${req.user._id}_${Date.now()}`
            };

            const order = await razorpay.orders.create(options);
            transactionData.razorpayOrderId = order.id;
        }

        const transaction = await Transaction.create(transactionData);

        res.status(201).json({
            success: true,
            data: transaction,
            razorpayOrder: paymentMethod === 'Razorpay' ? {
                id: transaction.razorpayOrderId,
                amount: amount * 100,
                currency: 'INR'
            } : null
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/transactions/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
    try {
        const { transactionId, razorpayPaymentId, razorpaySignature } = req.body;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction || transaction.paymentMethod !== 'Razorpay') {
            return next(new ErrorResponse('Invalid transaction', 400));
        }

        const text = transaction.razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
            .update(text)
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            transaction.status = 'Failed';
            await transaction.save();
            return next(new ErrorResponse('Payment verification failed', 400));
        }

        transaction.razorpayPaymentId = razorpayPaymentId;
        transaction.razorpaySignature = razorpaySignature;
        transaction.status = 'Success';
        await transaction.save();

        await processSuccessfulTransaction(transaction);

        res.status(200).json({ success: true, message: 'Payment verified successfully', data: transaction });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all transactions (Admin)
// @route   GET /api/transactions/admin
// @access  Private/Admin
exports.getAdminTransactions = async (req, res, next) => {
    try {
        const transactions = await Transaction.find()
            .populate('dealer', 'name phone email')
            .populate('subscriptionPlan', 'name price durationDays')
            .populate('promotionPlan', 'name price durationDays')
            .populate('property', 'title city')
            .sort('-createdAt');

        res.status(200).json({ success: true, count: transactions.length, data: transactions });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current user transactions
// @route   GET /api/transactions/my-transactions
// @access  Private
exports.getMyTransactions = async (req, res, next) => {
    try {
        const transactions = await Transaction.find({ dealer: req.user._id })
            .populate('subscriptionPlan', 'name price durationDays')
            .populate('promotionPlan', 'name price durationDays')
            .populate('property', 'title')
            .sort('-createdAt');

        res.status(200).json({ success: true, count: transactions.length, data: transactions });
    } catch (err) {
        next(err);
    }
};

// @desc    Update offline transaction status (Admin)
// @route   PUT /api/transactions/admin/:id
// @access  Private/Admin
exports.updateTransactionStatus = async (req, res, next) => {
    try {
        const { status, adminNotes } = req.body;
        
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return next(new ErrorResponse('Transaction not found', 404));

        if (transaction.status === 'Success') {
            return next(new ErrorResponse('Cannot change status of an already successful transaction', 400));
        }

        transaction.status = status;
        if (adminNotes !== undefined) transaction.adminNotes = adminNotes;
        await transaction.save();

        if (status === 'Success') {
            await processSuccessfulTransaction(transaction);
        }

        res.status(200).json({ success: true, data: transaction });
    } catch (err) {
        next(err);
    }
};

// Helper function to process benefits
const processSuccessfulTransaction = async (transaction) => {
    if (transaction.itemType === 'Subscription') {
        const plan = await SubscriptionPlan.findById(transaction.subscriptionPlan);
        const user = await User.findById(transaction.dealer);
        
        if (plan && user) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + plan.durationDays);

            user.activeSubscription = {
                plan: plan._id,
                startDate,
                endDate,
                status: 'active'
            };
            await user.save();
        }
    } else if (transaction.itemType === 'Promotion') {
        const plan = await PromotionPlan.findById(transaction.promotionPlan);
        const property = await Property.findById(transaction.property);
        
        if (plan && property) {
            const featuredUntil = new Date();
            featuredUntil.setDate(featuredUntil.getDate() + plan.durationInDays);

            property.isFeatured = true;
            property.featuredUntil = featuredUntil;
            await property.save();
        }
    }
};
