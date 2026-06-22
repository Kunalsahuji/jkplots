const PromotionPlan = require('../models/PromotionPlan');
const Transaction = require('../models/Transaction');
const Property = require('../models/Property');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
// We use a getter or inline init to ensure env vars are loaded
const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// ─── USER / DEALER ENDPOINTS ──────────────────────────────────────────────────

// @desc    Get all active promotion plans
// @route   GET /api/promotions/plans
// @access  Public
exports.getPlans = asyncHandler(async (req, res, next) => {
    const plans = await PromotionPlan.find({ isActive: true }).sort('price');
    res.status(200).json({
        success: true,
        count: plans.length,
        data: plans
    });
});

// @desc    Create Razorpay Order for Property Promotion
// @route   POST /api/promotions/order
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
    const { planId, propertyId } = req.body;

    const plan = await PromotionPlan.findById(planId);
    if (!plan || !plan.isActive) {
        return next(new ErrorResponse('Invalid or inactive promotion plan', 400));
    }

    const property = await Property.findById(propertyId);
    if (!property) {
        return next(new ErrorResponse('Property not found', 404));
    }

    // Check if user owns the property
    if (property.dealer.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to promote this property', 403));
    }

    const instance = getRazorpayInstance();

    const options = {
        amount: plan.price * 100, // amount in smallest currency unit (paise)
        currency: 'INR',
        receipt: `receipt_${Date.now()}_${propertyId.substring(0,5)}`
    };

    const order = await instance.orders.create(options);

    // Save transaction as pending/created
    const transaction = await Transaction.create({
        itemType: 'Promotion',
        property: propertyId,
        dealer: req.user.id,
        promotionPlan: planId,
        paymentMethod: 'Razorpay',
        amount: plan.price,
        razorpayOrderId: order.id,
        status: 'Pending'
    });

    res.status(200).json({
        success: true,
        order,
        transactionId: transaction._id
    });
});

// @desc    Verify Razorpay Payment & Activate Promotion
// @route   POST /api/promotions/verify
// @access  Private
exports.verifyPayment = asyncHandler(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = req.body;

    const transaction = await Transaction.findById(transactionId).populate('promotionPlan');
    if (!transaction || transaction.paymentMethod !== 'Razorpay') {
        return next(new ErrorResponse('Transaction not found', 404));
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        // Payment is successful
        transaction.status = 'Success';
        transaction.razorpayPaymentId = razorpay_payment_id;
        transaction.razorpaySignature = razorpay_signature;
        await transaction.save();

        // Update Property
        const property = await Property.findById(transaction.property);
        if (property) {
            property.isFeatured = true;
            // Calculate expiry
            let currentExpiry = property.featuredUntil && property.featuredUntil > Date.now() 
                ? new Date(property.featuredUntil) 
                : new Date();
            
            // `promotionPlan` is populated now instead of `plan`
            currentExpiry.setDate(currentExpiry.getDate() + transaction.promotionPlan.durationInDays);
            property.featuredUntil = currentExpiry;
            await property.save();
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified and property promoted successfully'
        });
    } else {
        transaction.status = 'Failed';
        await transaction.save();
        return next(new ErrorResponse('Invalid payment signature', 400));
    }
});


// ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────

// @desc    Get all promotion plans (including inactive)
// @route   GET /api/promotions/admin/plans
// @access  Private/Admin
exports.getAdminPlans = asyncHandler(async (req, res, next) => {
    const plans = await PromotionPlan.find().sort('-createdAt');
    res.status(200).json({
        success: true,
        count: plans.length,
        data: plans
    });
});

// @desc    Create a promotion plan
// @route   POST /api/promotions/admin/plans
// @access  Private/Admin
exports.createPlan = asyncHandler(async (req, res, next) => {
    const plan = await PromotionPlan.create(req.body);
    res.status(201).json({
        success: true,
        data: plan
    });
});

// @desc    Update a promotion plan
// @route   PUT /api/promotions/admin/plans/:id
// @access  Private/Admin
exports.updatePlan = asyncHandler(async (req, res, next) => {
    const plan = await PromotionPlan.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!plan) {
        return next(new ErrorResponse('Plan not found', 404));
    }

    res.status(200).json({
        success: true,
        data: plan
    });
});

// @desc    Delete a promotion plan
// @route   DELETE /api/promotions/admin/plans/:id
// @access  Private/Admin
exports.deletePlan = asyncHandler(async (req, res, next) => {
    const plan = await PromotionPlan.findByIdAndDelete(req.params.id);

    if (!plan) {
        return next(new ErrorResponse('Plan not found', 404));
    }

    res.status(200).json({
        success: true,
        data: {}
    });
});
