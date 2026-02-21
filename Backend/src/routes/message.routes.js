const express = require('express');
const messageController = require('../controllers/message.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Get conversation with a specific user
router.get('/:userId', authMiddleware, messageController.getConversation);

// Send message to a specific user
router.post('/send/:userId', authMiddleware, messageController.sendMessage);

module.exports = router;
