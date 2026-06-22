const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
    createReport,
    getReports,
    updateReportStatus,
    deleteReport,
    getMyReports
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// Optional protect middleware to associate user if logged in
const optionalProtect = async (req, res, next) => {
    let token;
    if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-__v');
        } catch (err) {
            // Ignore token verification errors since auth is optional here
        }
    }
    next();
};

router.route('/')
    .post(protect, createReport);

router.route('/my-reports')
    .get(protect, getMyReports);

router.route('/admin')
    .get(protect, authorize('admin', 'superadmin'), getReports);

router.route('/admin/:id')
    .put(protect, authorize('admin', 'superadmin'), updateReportStatus)
    .delete(protect, authorize('admin', 'superadmin'), deleteReport);

module.exports = router;
