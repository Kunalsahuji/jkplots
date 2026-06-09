const express = require('express');
const router = express.Router();

const {
    getNotifications,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notificationController');

const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
