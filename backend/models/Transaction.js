const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    itemType: {
        type: String,
        enum: ['Subscription', 'Promotion'],
        required: true
    },
    dealer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subscriptionPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: function() { return this.itemType === 'Subscription'; }
    },
    promotionPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PromotionPlan',
        required: function() { return this.itemType === 'Promotion'; }
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: function() { return this.itemType === 'Promotion'; }
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['Razorpay', 'Offline'],
        required: true
    },
    razorpayOrderId: {
        type: String,
        // Only required if method is Razorpay
        required: function() { return this.paymentMethod === 'Razorpay'; }
    },
    razorpayPaymentId: {
        type: String
    },
    razorpaySignature: {
        type: String
    },
    offlineReference: {
        type: String, // e.g., bank transfer UTR number, check number, or simply "Cash"
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Success', 'Failed', 'Rejected'],
        default: 'Pending'
    },
    adminNotes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', TransactionSchema);
