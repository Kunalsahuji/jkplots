const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getBlogs,
    getBlogBySlug,
    createBlog,
    getMyBlogs,
    updateBlog,
    deleteBlog,
    getAdminBlogs,
    updateBlogStatus
} = require('../controllers/blogController');

// Public routes
router.get('/', getBlogs);
router.get('/:slug', getBlogBySlug);

// Dealer / Author routes
router.use('/author', protect, authorize('dealer', 'admin'));
router.post('/author', createBlog);
router.get('/author/my-blogs', getMyBlogs);
router.route('/author/:id')
    .put(updateBlog)
    .delete(deleteBlog);

// Admin routes
router.use('/admin', protect, authorize('admin'));
router.get('/admin/all', getAdminBlogs);
router.put('/admin/:id/status', updateBlogStatus);

module.exports = router;
