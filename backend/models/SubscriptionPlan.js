const mongoose = require('mongoose');

const SubscriptionPlanSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Plan name is required'],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        durationDays: {
            type: Number,
            required: [true, 'Duration in days is required'],
            min: [1, 'Duration must be at least 1 day'],
        },
        listingLimit: {
            type: Number,
            required: [true, 'Listing limit is required'],
            min: [1, 'Listing limit must be at least 1'],
        },
        features: [
            {
                type: String,
                trim: true,
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        isPopular: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
