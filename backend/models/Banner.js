const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a banner title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    imageUrl: {
        type: String,
        default: ''
    },
    isDefaultAsset: {
        type: Boolean,
        default: false
    },
    assetKey: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'Description cannot be more than 200 characters']
    },
    targetUrl: {
        type: String,
        default: ''
    },
    placement: {
        type: String,
        enum: ['homepage_hero', 'dashboard_top', 'property_list'],
        default: 'homepage_hero'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    clicks: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Banner', BannerSchema);
