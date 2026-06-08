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
        enum: ['Apartment', 'Villa', 'Plot', 'Commercial']
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
    dealerPhone: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Property', PropertySchema);
