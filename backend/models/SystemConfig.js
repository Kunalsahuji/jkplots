const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema({
    isSubscriptionEnforced: {
        type: Boolean,
        default: false
    },
    freeListingLimit: {
        type: Number,
        default: 50
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);
