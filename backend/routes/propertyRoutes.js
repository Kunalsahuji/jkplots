const express = require('express');
const router = express.Router();
const { getProperties, createProperty, getProperty, updateProperty, deleteProperty, addPropertyReview, updatePropertyReview, deletePropertyReview, incrementView } = require('../controllers/propertyController');
const { protect, authorize } = require('../middleware/auth');
const { propertyValidation } = require('../middleware/propertyValidation');
const validate = require('../utils/validate');

router.route('/')
    .get(getProperties)
    .post(protect, authorize('dealer', 'admin'), propertyValidation, validate, createProperty);

router.route('/:id')
    .get(getProperty)
    .put(protect, authorize('dealer', 'admin'), propertyValidation, validate, updateProperty)
    .delete(protect, authorize('dealer', 'admin'), deleteProperty);

router.route('/:id/reviews')
    .post(protect, addPropertyReview);

router.route('/:id/reviews/:reviewId')
    .put(protect, updatePropertyReview)
    .delete(protect, deletePropertyReview);

router.route('/:id/view')
    .put(incrementView);

module.exports = router;
