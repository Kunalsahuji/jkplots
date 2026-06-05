const express = require('express');
const router = express.Router();
const { getProperties, createProperty } = require('../controllers/propertyController');

router.route('/')
    .get(getProperties)
    .post(createProperty);

module.exports = router;
