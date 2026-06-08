const express = require('express');
const router = express.Router();
const { getProperties, createProperty, getProperty, updateProperty, deleteProperty } = require('../controllers/propertyController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(getProperties)
    .post(protect, authorize('dealer', 'admin'), createProperty);

router.route('/:id')
    .get(getProperty)
    .put(protect, authorize('dealer', 'admin'), updateProperty)
    .delete(protect, authorize('dealer', 'admin'), deleteProperty);

module.exports = router;
