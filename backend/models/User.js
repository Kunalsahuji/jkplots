const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: [true, 'Please add a mobile number'],
        unique: true,
        trim: true,
        maxlength: [10, 'Mobile number cannot be more than 10 digits']
    },
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'dealer'],
        default: 'user'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
