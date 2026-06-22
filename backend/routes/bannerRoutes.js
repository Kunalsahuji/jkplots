const express = require('express');
const router = express.Router();
const {
    getActiveBanners,
    trackBannerClick,
    getAdminBanners,
    createBanner,
    updateBanner,
    deleteBanner
} = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(getActiveBanners);

router.route('/:id/click')
    .put(trackBannerClick);

router.route('/admin')
    .get(protect, authorize('admin', 'superadmin'), getAdminBanners)
    .post(protect, authorize('admin', 'superadmin'), createBanner);

router.route('/admin/:id')
    .put(protect, authorize('admin', 'superadmin'), updateBanner)
    .delete(protect, authorize('admin', 'superadmin'), deleteBanner);

module.exports = router;
