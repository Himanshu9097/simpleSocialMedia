const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware.verifyToken, notificationController.getNotifications);
router.post('/read', authMiddleware.verifyToken, notificationController.markAsRead);

module.exports = router;
