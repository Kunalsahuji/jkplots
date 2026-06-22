const express = require('express');
const router = express.Router();
const { getConfig, updateConfig } = require('../controllers/systemConfigController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(getConfig)
    .put(protect, authorize('admin', 'superadmin'), updateConfig);

module.exports = router;
