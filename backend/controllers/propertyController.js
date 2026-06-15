const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Property = require('../models/Property');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// Helper to save base64 to Cloudinary with local-disk fallback
const saveBase64File = async (base64Str) => {
    try {
        if (!base64Str || !base64Str.startsWith('data:')) {
            return base64Str; // Already a URL or relative path
        }

        // Try Cloudinary first
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (cloudName && apiKey && apiSecret) {
            const timestamp = Math.round(new Date().getTime() / 1000);
            const signatureStr = `timestamp=${timestamp}${apiSecret}`;
            const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

            const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file: base64Str,
                    api_key: apiKey,
                    timestamp: timestamp,
                    signature: signature
                })
            });

            const result = await response.json();
            if (result.secure_url) {
                return result.secure_url;
            } else if (result.error) {
                console.error('Cloudinary Upload Failed:', result.error.message);
            }
        }
    } catch (cloudinaryErr) {
        console.error('Cloudinary integration error, falling back to disk:', cloudinaryErr);
    }

    // Fallback: Save to Local Disk
    try {
        const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return base64Str;
        }

        const mimeType = matches[1];
        const ext = mimeType.split('/')[1] || 'png';
        const dataBuffer = Buffer.from(matches[2], 'base64');

        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filename = `file_${Date.now()}_${Math.round(Math.random() * 1e6)}.${ext}`;
        const filePath = path.join(uploadDir, filename);

        fs.writeFileSync(filePath, dataBuffer);
        return `/uploads/${filename}`;
    } catch (diskErr) {
        console.error('Local disk fallback failed:', diskErr);
        return base64Str;
    }
};

// @desc    Get all properties (with filtering)
// @route   GET /api/properties
// @access  Public
exports.getProperties = async (req, res, next) => {
    try {
        const reqQuery = { ...req.query };

        // Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit'];
        removeFields.forEach(param => delete reqQuery[param]);

        const filterObj = {};

        // City (case-insensitive regex)
        if (reqQuery.city && reqQuery.city !== 'All') {
            filterObj.city = { $regex: new RegExp(`^${reqQuery.city}$`, 'i') };
        }

        // Type
        if (reqQuery.type && reqQuery.type !== 'All') {
            filterObj.type = reqQuery.type;
        }

        // Purpose & Commercial logic
        if (reqQuery.purpose && reqQuery.purpose !== 'All') {
            if (reqQuery.purpose === 'Commercial') {
                filterObj.$or = [
                    { purpose: 'Commercial' },
                    { type: 'Commercial' }
                ];
            } else {
                filterObj.purpose = reqQuery.purpose;
            }
        }

        // Global search (title, description, city, locality, type, furnishing)
        if (reqQuery.search) {
            const searchRegex = { $regex: reqQuery.search, $options: 'i' };
            const searchOr = [
                { title: searchRegex },
                { description: searchRegex },
                { city: searchRegex },
                { locality: searchRegex },
                { type: searchRegex },
                { furnishing: searchRegex }
            ];
            
            // If we already have an $or from Commercial, we must use $and to combine them
            if (filterObj.$or) {
                filterObj.$and = [ { $or: filterObj.$or }, { $or: searchOr } ];
                delete filterObj.$or;
            } else {
                filterObj.$or = searchOr;
            }
        }

        // Locality (partial regex match)
        if (reqQuery.locality) {
            filterObj.locality = { $regex: reqQuery.locality, $options: 'i' };
        }

        // Bedrooms
        if (reqQuery.bedrooms) {
            filterObj.bedrooms = Number(reqQuery.bedrooms);
        }

        // isFeatured filter
        if (reqQuery.isFeatured === 'true') {
            filterObj.isFeatured = true;
            filterObj.featuredUntil = { $gt: Date.now() };
        } else if (reqQuery.isFeatured === 'false') {
            filterObj.$or = [
                { isFeatured: false },
                { featuredUntil: { $lte: Date.now() } },
                { featuredUntil: null },
                { featuredUntil: { $exists: false } }
            ];
        }

        // Price parsing (budget bounds)
        const priceFilter = {};
        if (req.query['price[lte]']) {
            priceFilter.$lte = Number(req.query['price[lte]']);
        }
        if (req.query['price[gte]']) {
            priceFilter.$gte = Number(req.query['price[gte]']);
        }
        if (Object.keys(priceFilter).length > 0) {
            filterObj.price = priceFilter;
        }

        // Pagination parameters
        const page = parseInt(req.query.page, 10);
        const limit = parseInt(req.query.limit, 10);

        let query = Property.find(filterObj).lean();

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        const total = await Property.countDocuments(filterObj);

        // Apply pagination if parameters exist
        if (page && limit) {
            const startIndex = (page - 1) * limit;
            query = query.skip(startIndex).limit(limit);
        }

        const properties = await query;

        res.status(200).json({
            success: true,
            total,
            count: properties.length,
            pagination: page && limit ? {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                limit
            } : null,
            data: properties
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single property by ID
// @route   GET /api/properties/:id
// @access  Public
exports.getProperty = async (req, res, next) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return next(new ErrorResponse(`Property not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: property
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new property
// @route   POST /api/properties
// @access  Private (Dealer/Admin)
exports.createProperty = async (req, res, next) => {
    try {
        // Enforce the dealer phone and ID from the authenticated user session
        req.body.dealerPhone = req.user.phone;
        req.body.dealer = req.user._id;

        // Coerce numeric fields to positive absolute integers
        if (req.body.price !== undefined) {
            req.body.price = Math.abs(Math.round(Number(req.body.price) || 0));
        }
        if (req.body.area !== undefined) {
            req.body.area = Math.abs(Math.round(Number(req.body.area) || 0));
        }
        if (req.body.bedrooms !== undefined) {
            req.body.bedrooms = Math.abs(Math.round(Number(req.body.bedrooms) || 0));
        }
        if (req.body.bathrooms !== undefined) {
            req.body.bathrooms = Math.abs(Math.round(Number(req.body.bathrooms) || 0));
        }
        if (req.body.balconies !== undefined) {
            req.body.balconies = Math.abs(Math.round(Number(req.body.balconies) || 0));
        }

        // Handle base64 photo uploads if present
        if (req.body.photos && Array.isArray(req.body.photos)) {
            req.body.photos = await Promise.all(req.body.photos.map(p => saveBase64File(p)));
        }

        // Handle base64 video upload if present
        if (req.body.video) {
            req.body.video = await saveBase64File(req.body.video);
        }

        const property = await Property.create(req.body);

        // Update the user's myProperties array
        await User.findByIdAndUpdate(req.user._id, {
            $push: { myProperties: property._id }
        });

        res.status(201).json({
            success: true,
            data: property
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private (Dealer/Admin)
exports.updateProperty = async (req, res, next) => {
    try {
        let property = await Property.findById(req.params.id);

        if (!property) {
            return next(new ErrorResponse(`Property not found with id of ${req.params.id}`, 404));
        }

        // Make sure user is property owner or admin
        if (property.dealerPhone !== req.user.phone && req.user.role !== 'admin') {
            return next(new ErrorResponse(`User not authorized to update this property`, 401));
        }

        // Coerce numeric fields to positive absolute integers
        if (req.body.price !== undefined) {
            req.body.price = Math.abs(Math.round(Number(req.body.price) || 0));
        }
        if (req.body.area !== undefined) {
            req.body.area = Math.abs(Math.round(Number(req.body.area) || 0));
        }
        if (req.body.bedrooms !== undefined) {
            req.body.bedrooms = Math.abs(Math.round(Number(req.body.bedrooms) || 0));
        }
        if (req.body.bathrooms !== undefined) {
            req.body.bathrooms = Math.abs(Math.round(Number(req.body.bathrooms) || 0));
        }
        if (req.body.balconies !== undefined) {
            req.body.balconies = Math.abs(Math.round(Number(req.body.balconies) || 0));
        }

        // Handle base64 photos if they are updated
        if (req.body.photos && Array.isArray(req.body.photos)) {
            req.body.photos = await Promise.all(req.body.photos.map(p => saveBase64File(p)));
        }

        // Handle base64 video upload if present
        if (req.body.video) {
            req.body.video = await saveBase64File(req.body.video);
        }

        property = await Property.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: property
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (Dealer/Admin)
exports.deleteProperty = async (req, res, next) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return next(new ErrorResponse(`Property not found with id of ${req.params.id}`, 404));
        }

        // Make sure user is property owner or admin
        if (property.dealerPhone !== req.user.phone && req.user.role !== 'admin') {
            return next(new ErrorResponse(`User not authorized to delete this property`, 401));
        }

        await property.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a review to a property
// @route   POST /api/properties/:id/reviews
// @access  Private
exports.addPropertyReview = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return next(new ErrorResponse('Please provide a rating between 1 and 5', 400));
        }

        const property = await Property.findById(req.params.id);

        if (!property) {
            return next(new ErrorResponse(`Property not found with id of ${req.params.id}`, 404));
        }

        const review = {
            userName: req.user.name || 'Anonymous User',
            rating: Number(rating),
            comment: comment || '',
            createdAt: new Date()
        };

        if (!property.reviews) {
            property.reviews = [];
        }

        property.reviews.push(review);
        await property.save();

        res.status(201).json({
            success: true,
            data: property.reviews,
            message: 'Review added successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a review on a property
// @route   PUT /api/properties/:id/reviews/:reviewId
// @access  Private
exports.updatePropertyReview = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;
        const property = await Property.findById(req.params.id);

        if (!property) {
            return next(new ErrorResponse(`Property not found with id of ${req.params.id}`, 404));
        }

        const review = property.reviews.id(req.params.reviewId);
        if (!review) {
            return next(new ErrorResponse('Review not found', 404));
        }

        if (review.userName !== req.user.name && req.user.role !== 'admin') {
            return next(new ErrorResponse('User not authorized to update this review', 401));
        }

        if (rating) review.rating = Number(rating);
        if (comment !== undefined) review.comment = comment;

        await property.save();

        res.status(200).json({
            success: true,
            data: property.reviews,
            message: 'Review updated successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a review from a property
// @route   DELETE /api/properties/:id/reviews/:reviewId
// @access  Private
exports.deletePropertyReview = async (req, res, next) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return next(new ErrorResponse(`Property not found with id of ${req.params.id}`, 404));
        }

        const review = property.reviews.id(req.params.reviewId);
        if (!review) {
            return next(new ErrorResponse('Review not found', 404));
        }

        if (review.userName !== req.user.name && req.user.role !== 'admin') {
            return next(new ErrorResponse('User not authorized to delete this review', 401));
        }

        review.deleteOne();
        await property.save();

        res.status(200).json({
            success: true,
            data: property.reviews,
            message: 'Review deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Increment property view count
// @route   PUT /api/properties/:id/view
// @access  Public
exports.incrementView = async (req, res, next) => {
    try {
        const propertyId = req.params.id;
        const viewerId = req.body?.viewerId || req.ip || 'anonymous';

        // Using findByIdAndUpdate directly avoids triggering Mongoose document validation
        // which might fail on older/seeded data missing required fields.
        const property = await Property.findByIdAndUpdate(
            propertyId,
            {
                $inc: { views: 1 },
                $addToSet: { viewedBy: viewerId } // $addToSet only pushes if it doesn't exist
            },
            { new: true }
        );
        
        if (!property) {
            return res.status(404).json({ success: false, message: 'Property not found' });
        }

        res.status(200).json({ success: true, views: property.views });
    } catch (err) {
        console.error('View increment error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Admin toggle property verification status
// @route   PUT /api/properties/:id/verify
// @access  Private (Admin/Superadmin)
exports.togglePropertyVerify = async (req, res, next) => {
    try {
        let property = await Property.findById(req.params.id);
        if (!property) {
            return next(new ErrorResponse(`Property not found`, 404));
        }

        property.verified = !property.verified;
        await property.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            data: property
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Admin toggle property featured status
// @route   PUT /api/properties/:id/feature
// @access  Private (Admin/Superadmin)
exports.togglePropertyFeature = async (req, res, next) => {
    try {
        let property = await Property.findById(req.params.id);
        if (!property) {
            return next(new ErrorResponse(`Property not found`, 404));
        }

        property.featured = !property.featured;
        await property.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            data: property
        });
    } catch (err) {
        next(err);
    }
};
