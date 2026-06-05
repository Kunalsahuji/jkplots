const Property = require('../models/Property');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all properties (with filtering)
// @route   GET /api/properties
// @access  Public
exports.getProperties = async (req, res, next) => {
    try {
        let query;

        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit'];

        // Loop over removeFields and delete them from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);

        // Create query search object
        let queryStr = JSON.stringify(reqQuery);

        // Create operators ($gt, $gte, etc)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        // Finding resource
        query = Property.find(JSON.parse(queryStr));

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Executing query
        const properties = await query;

        res.status(200).json({
            success: true,
            count: properties.length,
            data: properties
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new property
// @route   POST /api/properties
// @access  Public
exports.createProperty = async (req, res, next) => {
    try {
        const property = await Property.create(req.body);

        res.status(201).json({
            success: true,
            data: property
        });
    } catch (err) {
        next(err);
    }
};
