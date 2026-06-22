const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a blog title'],
        trim: true,
        maxlength: [150, 'Title cannot be more than 150 characters']
    },
    slug: {
        type: String,
        unique: true,
        required: true
    },
    excerpt: {
        type: String,
        required: [true, 'Please add an excerpt'],
        maxlength: [300, 'Excerpt cannot be more than 300 characters']
    },
    content: {
        type: String,
        required: [true, 'Please add blog content']
    },
    coverImage: {
        type: String,
        required: [true, 'Please add a cover image']
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    tags: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Published', 'Rejected'],
        default: 'Pending'
    },
    seo: {
        metaTitle: {
            type: String,
            maxlength: 60
        },
        metaDescription: {
            type: String,
            maxlength: 160
        },
        keywords: {
            type: [String]
        }
    },
    publishedAt: {
        type: Date
    },
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Auto-generate SEO meta title/description if not provided
BlogSchema.pre('save', async function () {
    if (!this.seo) {
        this.seo = {};
    }
    if (!this.seo.metaTitle) {
        this.seo.metaTitle = this.title.substring(0, 60);
    }
    if (!this.seo.metaDescription) {
        this.seo.metaDescription = this.excerpt.substring(0, 160);
    }
});

module.exports = mongoose.model('Blog', BlogSchema);
