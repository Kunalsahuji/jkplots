const City = require('../models/City');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all cities
// @route   GET /api/cities
// @access  Public
exports.getCities = async (req, res, next) => {
    try {
        const query = {};
        // If not specified or not admin, only fetch active cities
        if (req.query.all !== 'true') {
            query.isActive = true;
        }

        const cities = await City.find(query).sort('name');

        res.status(200).json({
            success: true,
            count: cities.length,
            data: cities
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new city
// @route   POST /api/cities
// @access  Private/Admin
exports.createCity = async (req, res, next) => {
    try {
        const { name, state, isActive } = req.body;

        if (!name) {
            return next(new ErrorResponse('City name is required', 400));
        }

        // Check if city already exists
        const cityExists = await City.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
        if (cityExists) {
            return next(new ErrorResponse('City already exists', 400));
        }

        const city = await City.create({
            name: name.trim(),
            state: state || 'Jammu and Kashmir',
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            data: city
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a city
// @route   PUT /api/cities/:id
// @access  Private/Admin
exports.updateCity = async (req, res, next) => {
    try {
        const { name, state, isActive } = req.body;

        let city = await City.findById(req.params.id);
        if (!city) {
            return next(new ErrorResponse('City not found', 404));
        }

        if (name) {
            // Check if name is taken by another city
            const cityExists = await City.findOne({ 
                name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
                _id: { $ne: req.params.id }
            });
            if (cityExists) {
                return next(new ErrorResponse('City name already exists', 400));
            }
            city.name = name.trim();
        }

        if (state) city.state = state;
        if (isActive !== undefined) city.isActive = isActive;

        await city.save();

        res.status(200).json({
            success: true,
            data: city
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a city
// @route   DELETE /api/cities/:id
// @access  Private/Admin
exports.deleteCity = async (req, res, next) => {
    try {
        const city = await City.findById(req.params.id);
        if (!city) {
            return next(new ErrorResponse('City not found', 404));
        }

        await city.deleteOne();

        res.status(200).json({
            success: true,
            message: 'City deleted successfully',
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
