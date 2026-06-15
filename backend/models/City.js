const mongoose = require('mongoose');

const CitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a city name'],
        unique: true,
        trim: true
    },
    state: {
        type: String,
        default: 'Jammu and Kashmir',
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('City', CitySchema);
