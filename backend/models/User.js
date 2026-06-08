const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: [true, 'Mobile number is required'],
            unique: true,
            trim: true,
            match: [/^\d{10}$/, 'Enter a valid 10-digit mobile number'],
        },
        name: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [60, 'Name cannot exceed 60 characters'],
            match: [/^[A-Za-z\s]+$/, 'Name must contain only letters and spaces'],
        },
        role: {
            type: String,
            enum: {
                values: ['user', 'dealer', 'admin'],
                message: 'Role must be user, dealer, or admin',
            },
            default: 'user',
        },
        // Saved property IDs (heart/bookmark feature)
        savedProperties: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Property',
            },
        ],
        // Temporary OTP storage (will be replaced by SMS provider later)
        // In production: store hashed OTP with expiry
        otp: {
            code: { type: String, select: false },
            expiresAt: { type: Date, select: false },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        // Exclude __v from all queries by default
        toJSON: { versionKey: false },
        toObject: { versionKey: false },
    }
);

// Index for faster phone lookups on login
UserSchema.index({ phone: 1 });

module.exports = mongoose.model('User', UserSchema);
