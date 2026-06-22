const SubscriptionPlan = require('../models/SubscriptionPlan');
const User = require('../models/User');
const Property = require('../models/Property');
const SystemConfig = require('../models/SystemConfig');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Get all active plans (Public/Dealer)
exports.getActivePlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
        res.status(200).json({ success: true, data: plans });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all plans (Admin)
exports.getAllPlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find().sort({ price: 1 });
        res.status(200).json({ success: true, data: plans });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create a plan (Admin)
exports.createPlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.create(req.body);
        res.status(201).json({ success: true, data: plan, message: 'Subscription plan created successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update a plan (Admin)
exports.updatePlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
        res.status(200).json({ success: true, data: plan, message: 'Plan updated successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete a plan (Admin)
exports.deletePlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
        if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
        res.status(200).json({ success: true, message: 'Plan deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get current user's subscription details and usage
exports.getMySubscription = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('activeSubscription.plan');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        let activeCount = 0;
        let totalLimit = 0;
        let planDetails = null;

        // Count properties listed by user
        activeCount = await Property.countDocuments({ dealer: req.user.id });

        // Load System Config for free tier limits
        let config = await SystemConfig.findOne();
        if (!config) config = { isSubscriptionEnforced: false, freeListingLimit: 50 };

        totalLimit = config.freeListingLimit;

        if (user.activeSubscription && user.activeSubscription.status === 'active' && user.activeSubscription.endDate > new Date()) {
            totalLimit = Math.max(config.freeListingLimit, user.activeSubscription.plan?.listingLimit || 0);
            planDetails = user.activeSubscription;
        }

        res.status(200).json({
            success: true,
            data: {
                activeSubscription: planDetails,
                usage: {
                    used: activeCount,
                    limit: totalLimit,
                    remaining: Math.max(0, totalLimit - activeCount)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Razorpay checkout for Subscription
exports.createSubscriptionOrder = async (req, res) => {
    try {
        const { planId } = req.body;
        const plan = await SubscriptionPlan.findById(planId);
        
        if (!plan || !plan.isActive) {
            return res.status(400).json({ success: false, message: 'Invalid or inactive plan' });
        }

        if (plan.price === 0) {
            // Handle free plan assignment immediately
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.durationDays);
            
            await User.findByIdAndUpdate(req.user.id, {
                activeSubscription: {
                    plan: plan._id,
                    startDate: new Date(),
                    endDate: endDate,
                    status: 'active'
                }
            });
            return res.status(200).json({ success: true, message: 'Free plan activated', isFree: true });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_SECRET_KEY,
        });

        const options = {
            amount: plan.price * 100, // in paise
            currency: 'INR',
            receipt: `sub_receipt_${Date.now()}_${req.user.id}`,
        };

        const order = await razorpay.orders.create(options);
        
        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            planId: plan._id
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Payment gateway error: ' + error.message });
    }
};

exports.verifySubscriptionPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
        
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
            .update(sign.toString())
            .digest('hex');

        if (razorpay_signature === expectedSign) {
            const plan = await SubscriptionPlan.findById(planId);
            
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.durationDays);

            // Update User Subscription
            await User.findByIdAndUpdate(req.user.id, {
                activeSubscription: {
                    plan: plan._id,
                    startDate: new Date(),
                    endDate: endDate,
                    status: 'active'
                }
            });

            res.status(200).json({ success: true, message: 'Payment successful, subscription activated!' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
