const express = require('express');
const router = express.Router();
const {
    adminLogin,
    getAdminMe,
    adminLogout,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.post('/login', adminLogin);
router.post('/logout', protect, authorize('admin', 'superadmin'), adminLogout);
router.get('/me', protect, authorize('admin', 'superadmin'), getAdminMe);

module.exports = router;
