const express = require('express');
const router = express.Router();
const {
    getLegalPage,
    updateLegalPage
} = require('../controllers/legalController');
const { protect, authorize } = require('../middleware/auth');

router.route('/:slug')
    .get(getLegalPage)
    .put(protect, authorize('admin', 'superadmin'), updateLegalPage);

module.exports = router;
