const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: [true, 'Mobile number is required'],
            unique: true,
            trim: true,
            match: [/^\+91[6-9]\d{9}$/, 'Enter a valid mobile number starting with +91 followed by 10 digits starting with 6-9'],
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
        // Properties created by this user (dealer)
        myProperties: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Property',
            },
        ],
        // Enquiries made by this user
        myEnquiries: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Enquiry',
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
        panNumber: {
            type: String,
            trim: true,
            uppercase: true,
            match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN Card Number'],
        },
        panName: {
            type: String,
            trim: true,
        },
        kycStatus: {
            type: String,
            enum: ['unverified', 'pending', 'approved', 'rejected'],
            default: 'unverified',
        },
        activeSubscription: {
            plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
            startDate: { type: Date },
            endDate: { type: Date },
            status: { type: String, enum: ['active', 'expired', 'none'], default: 'none' }
        },
    },
    {
        timestamps: true,
        // Exclude __v from all queries by default
        toJSON: { versionKey: false },
        toObject: { versionKey: false },
    }
);

module.exports = mongoose.model('User', UserSchema);
