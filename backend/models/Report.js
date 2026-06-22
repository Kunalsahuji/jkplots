const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: [true, 'Please associate the report with a listing']
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reporterPhone: {
        type: String,
        trim: true,
        default: ''
    },
    reason: {
        type: String,
        required: [true, 'Please specify a reason category'],
        enum: ['Fraud/Scam', 'Incorrect Details', 'Duplicate Listing', 'Sold/Unavailable', 'Spam/Other']
    },
    description: {
        type: String,
        required: [true, 'Please explain the issue in detail'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Dismissed'],
        default: 'Pending'
    },
    adminResponse: {
        type: String,
        default: ''
    },
    resolvedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', ReportSchema);
