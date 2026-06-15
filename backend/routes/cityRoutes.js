const express = require('express');
const router = express.Router();
const {
    getCities,
    createCity,
    updateCity,
    deleteCity
} = require('../controllers/cityController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(getCities)
    .post(protect, authorize('admin', 'superadmin'), createCity);

router.route('/:id')
    .put(protect, authorize('admin', 'superadmin'), updateCity)
    .delete(protect, authorize('admin', 'superadmin'), deleteCity);

module.exports = router;
