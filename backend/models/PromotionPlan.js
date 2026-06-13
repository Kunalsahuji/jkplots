const mongoose = require('mongoose');

const PromotionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a plan name']
    },
    durationInDays: {
        type: Number,
        required: [true, 'Please specify the duration in days']
    },
    price: {
        type: Number,
        required: [true, 'Please specify the price']
    },
    description: {
        type: [String],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PromotionPlan', PromotionPlanSchema);
