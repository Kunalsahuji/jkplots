const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a property title'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    purpose: {
        type: String,
        required: [true, 'Please specify the purpose'],
        enum: ['Buy', 'Rent', 'Commercial']
    },
    type: {
        type: String,
        required: [true, 'Please specify property type'],
        enum: ['Flat/Apartment', 'Independent House / Villa', 'Independent / Builder Floor', 'Plot / Land', 'Office', 'Industry', 'Retail']
    },
    propertyType: {
        type: String
    },
    state: {
        type: String,
        default: 'Jammu and Kashmir'
    },
    division: {
        type: String
    },
    district: {
        type: String
    },
    city: {
        type: String,
        required: [true, 'Please specify the city']
    },
    locality: {
        type: String,
        required: [true, 'Please specify the locality/area']
    },
    bedrooms: {
        type: Number,
        default: 0
    },
    bathrooms: {
        type: Number,
        default: 0
    },
    balconies: {
        type: Number,
        default: 0
    },
    furnishing: {
        type: String
    },
    parking: {
        type: String
    },
    verified: {
        type: Boolean,
        default: false
    },
    washrooms: {
        type: String
    },
    amenities: {
        type: [String],
        default: []
    },
    area: {
        type: Number,
        required: [true, 'Please add the property area in sqft']
    },
    price: {
        type: Number,
        required: [true, 'Please specify the price']
    },
    contactNumber: {
        type: String,
        required: [true, 'Please add a contact number']
    },
    photos: {
        type: [String],
        default: []
    },
    video: {
        type: String
    },
    dealer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dealerPhone: {
        type: String
    },
    reviews: [
        {
            userName: { type: String, required: true },
            rating: { type: Number, required: true, min: 1, max: 5 },
            comment: { type: String, default: "" },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    views: {
        type: Number,
        default: 0
    },
    viewedBy: [
        { type: String }
    ],
    likes: {
        type: Number,
        default: 0
    },
    enquiriesCount: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    featuredUntil: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Property', PropertySchema);
