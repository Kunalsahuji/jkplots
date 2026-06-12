const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: [true, 'Property reference is required']
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dealer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dealerPhone: {
        type: String,
        required: [true, 'Dealer phone number is required']
    },
    buyerPhone: {
        type: String,
        required: [true, 'Buyer phone number is required']
    },
    buyerName: {
        type: String,
        required: [true, 'Buyer name is required']
    },
    message: {
        type: String,
        required: [true, 'Message is required']
    },
    status: {
        type: String,
        enum: ['Pending', 'Contacted', 'Closed'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Enquiry', EnquirySchema);
