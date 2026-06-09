const { body } = require('express-validator');

/**
 * Validation rules for creating and updating properties.
 * Aligned with the project SOP validation constraints.
 */
exports.propertyValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Property title is required')
        .isLength({ min: 10, max: 120 }).withMessage('Title must be between 10–120 characters'),

    body('description')
        .trim()
        .notEmpty().withMessage('Please add a description')
        .isLength({ min: 30, max: 2000 }).withMessage('Description must be at least 30 characters'),

    body('purpose')
        .notEmpty().withMessage('Please select a purpose')
        .isIn(['Buy', 'Rent', 'Commercial']).withMessage('Please select a valid purpose'),

    body('type')
        .notEmpty().withMessage('Please select a property type')
        .isIn(['Flat/Apartment', 'Independent House / Villa', 'Independent / Builder Floor', 'Plot / Land', 'Office', 'Industry', 'Retail']).withMessage('Please select a valid property type'),

    body('propertyType')
        .optional({ checkFalsy: true })
        .trim()
        .isIn(['Flat/Apartment', 'Independent House / Villa', 'Independent / Builder Floor', 'Plot / Land', 'Office', 'Industry', 'Retail']).withMessage('Please select a valid property type'),

    body('state')
        .optional()
        .trim()
        .notEmpty().withMessage('State is required'),

    body('division')
        .trim()
        .notEmpty().withMessage('Division is required')
        .isIn(['Jammu', 'Kashmir']).withMessage('Please select a valid division (Jammu or Kashmir)'),

    body('district')
        .trim()
        .notEmpty().withMessage('District is required')
        .isIn(['Jammu', 'Srinagar', 'Kathua', 'Udhampur', 'Anantnag', 'Baramulla']).withMessage('Please select a valid J&K district'),

    body('city')
        .trim()
        .notEmpty().withMessage('Please select a valid city')
        .isIn([
            'Jammu', 'Akhnoor', 'R.S. Pura', 'Bishnah',
            'Srinagar',
            'Kathua', 'Lakhanpur', 'Billawar',
            'Udhampur', 'Chenani', 'Ramnagar',
            'Anantnag', 'Pahalgam', 'Bijbehara',
            'Baramulla', 'Sopore', 'Uri'
        ]).withMessage('Please select a valid J&K city'),

    body('locality')
        .trim()
        .notEmpty().withMessage('Please specify the locality/area'),

    body('bedrooms')
        .optional({ nullable: true })
        .customSanitizer(val => val === '' ? 0 : Number(val))
        .isInt({ min: 0 }).withMessage('Bedrooms must be 0 or more'),

    body('bathrooms')
        .optional({ nullable: true })
        .customSanitizer(val => val === '' ? 0 : Number(val))
        .isInt({ min: 0 }).withMessage('Bathrooms must be 0 or more'),

    body('balconies')
        .optional({ nullable: true })
        .customSanitizer(val => val === '' ? 0 : Number(val))
        .isInt({ min: 0 }).withMessage('Balconies must be 0 or more'),

    body('furnishing')
        .optional({ checkFalsy: true })
        .trim(),

    body('parking')
        .optional({ checkFalsy: true })
        .trim(),

    body('washrooms')
        .optional({ checkFalsy: true })
        .trim(),

    body('amenities')
        .optional()
        .isArray().withMessage('Amenities must be an array of strings'),

    body('area')
        .notEmpty().withMessage('Area must be greater than 0')
        .customSanitizer(Number)
        .isFloat({ gt: 0 }).withMessage('Area must be greater than 0'),

    body('price')
        .notEmpty().withMessage('Price must be a positive number')
        .customSanitizer(Number)
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

    body('video')
        .optional({ checkFalsy: true })
        .trim(),

    body('contactNumber')
        .trim()
        .notEmpty().withMessage('Enter a valid contact number')
        .matches(/^\+91[6-9]\d{9}$/).withMessage('Enter a valid contact number starting with +91 followed by 10 digits starting with 6-9'),
];
