const express = require('express');
const router = express.Router();
const storyController = require('../controllers/story.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');

const upload = multer({storage: multer.memoryStorage()});

// Create a new story (must have an image)
router.post('/create', authMiddleware, upload.single("image"), storyController.createStory);

// Get stories for a specific user
router.get('/user/:username', authMiddleware, storyController.getUserStories);
// Get feed stories
router.get('/feed', authMiddleware, storyController.getFeedStories);

// Delete a story
router.delete('/:id', authMiddleware, storyController.deleteStory);

module.exports = router;
