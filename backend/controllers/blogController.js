const Blog = require('../models/Blog');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Helper to handle base64 image upload (Cloudinary with local fallback)
const saveBase64Image = async (base64Str, folderName = 'blogs') => {
    try {
        if (!base64Str || !base64Str.startsWith('data:image')) {
            return base64Str;
        }

        // Try Cloudinary first
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (cloudName && apiKey && apiSecret) {
            const timestamp = Math.round(new Date().getTime() / 1000);
            const signatureStr = `folder=${folderName}&timestamp=${timestamp}${apiSecret}`;
            const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

            const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file: base64Str,
                    api_key: apiKey,
                    timestamp: timestamp,
                    signature: signature,
                    folder: folderName
                })
            });

            const result = await response.json();
            if (result.secure_url) {
                return result.secure_url;
            } else if (result.error) {
                console.error('Cloudinary Upload Failed for blog:', result.error.message);
            }
        }
    } catch (cloudinaryErr) {
        console.error('Cloudinary integration error for blog, falling back to disk:', cloudinaryErr);
    }

    // Fallback: Save to Local Disk
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 string');
    }

    const ext = matches[1].split('/')[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
    const uploadPath = path.join(__dirname, '..', 'uploads', folderName);

    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadPath, fileName), buffer);
    return `/uploads/${folderName}/${fileName}`;
};

// Generate slug from title
const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// @desc    Get all published blogs
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = asyncHandler(async (req, res, next) => {
    const { search, tag } = req.query;
    let query = { status: 'Published' };

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } }
        ];
    }

    if (tag) {
        query.tags = tag;
    }

    const blogs = await Blog.find(query)
        .populate('author', 'name role avatar')
        .sort('-publishedAt');

    res.status(200).json({
        success: true,
        count: blogs.length,
        data: blogs
    });
});

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = asyncHandler(async (req, res, next) => {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'Published' })
        .populate('author', 'name role avatar');

    if (!blog) {
        return next(new ErrorResponse('Blog not found or not published yet', 404));
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.status(200).json({
        success: true,
        data: blog
    });
});

// ==========================================
// DEALER / AUTHOR ENDPOINTS
// ==========================================

// @desc    Create a blog
// @route   POST /api/blogs
// @access  Private (Dealer/Admin)
exports.createBlog = asyncHandler(async (req, res, next) => {
    // Process cover image
    if (req.body.coverImage && req.body.coverImage.startsWith('data:image')) {
        req.body.coverImage = await saveBase64Image(req.body.coverImage);
    }

    req.body.author = req.user.id;
    
    // Generate unique slug
    let baseSlug = generateSlug(req.body.title);
    let slug = baseSlug;
    let counter = 1;
    while (await Blog.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
    req.body.slug = slug;

    // Admins bypass pending state
    if (req.user.role === 'admin') {
        req.body.status = 'Published';
        req.body.publishedAt = new Date();
    } else {
        req.body.status = 'Pending';
    }

    const blog = await Blog.create(req.body);

    res.status(201).json({
        success: true,
        data: blog
    });
});

// @desc    Get my blogs
// @route   GET /api/blogs/my-blogs
// @access  Private (Dealer)
exports.getMyBlogs = asyncHandler(async (req, res, next) => {
    const blogs = await Blog.find({ author: req.user.id }).sort('-createdAt');
    
    res.status(200).json({
        success: true,
        count: blogs.length,
        data: blogs
    });
});

// @desc    Update my blog
// @route   PUT /api/blogs/:id
// @access  Private (Dealer)
exports.updateBlog = asyncHandler(async (req, res, next) => {
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
        return next(new ErrorResponse('Blog not found', 404));
    }

    if (blog.author.toString() !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
        return next(new ErrorResponse('Not authorized to update this blog', 403));
    }

    if (req.body.coverImage && req.body.coverImage.startsWith('data:image')) {
        req.body.coverImage = await saveBase64Image(req.body.coverImage);
    }

    // If a dealer updates a published blog, it goes back to pending
    if (!['admin', 'superadmin'].includes(req.user.role) && blog.status === 'Published') {
        req.body.status = 'Pending';
    }

    // Regenerate slug if title changed
    if (req.body.title && req.body.title !== blog.title) {
        let baseSlug = generateSlug(req.body.title);
        let slug = baseSlug;
        let counter = 1;
        while (await Blog.findOne({ slug, _id: { $ne: blog._id } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        req.body.slug = slug;
    }

    blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: blog
    });
});

// @desc    Delete my blog
// @route   DELETE /api/blogs/:id
// @access  Private (Dealer/Admin)
exports.deleteBlog = asyncHandler(async (req, res, next) => {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
        return next(new ErrorResponse('Blog not found', 404));
    }

    if (blog.author.toString() !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
        return next(new ErrorResponse('Not authorized to delete this blog', 403));
    }

    await blog.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// @desc    Get all blogs (for admin moderation)
// @route   GET /api/blogs/admin/all
// @access  Private (Admin)
exports.getAdminBlogs = asyncHandler(async (req, res, next) => {
    const blogs = await Blog.find()
        .populate('author', 'name role')
        .sort('-createdAt');
        
    res.status(200).json({
        success: true,
        count: blogs.length,
        data: blogs
    });
});

// @desc    Update blog status (Publish/Reject)
// @route   PUT /api/blogs/admin/:id/status
// @access  Private (Admin)
exports.updateBlogStatus = asyncHandler(async (req, res, next) => {
    const { status } = req.body;
    
    if (!['Draft', 'Pending', 'Published', 'Rejected'].includes(status)) {
        return next(new ErrorResponse('Invalid status', 400));
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
        return next(new ErrorResponse('Blog not found', 404));
    }

    blog.status = status;
    if (status === 'Published' && !blog.publishedAt) {
        blog.publishedAt = new Date();
    }

    await blog.save();

    res.status(200).json({
        success: true,
        data: blog
    });
});
