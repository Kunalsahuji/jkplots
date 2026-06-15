const mongoose = require('mongoose');

const LegalPageSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: [true, 'Please add a unique page slug'],
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: [true, 'Please add a page title'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Please add the page content']
    },
    updatedBy: {
        type: String,
        default: 'System Administrator'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LegalPage', LegalPageSchema);
