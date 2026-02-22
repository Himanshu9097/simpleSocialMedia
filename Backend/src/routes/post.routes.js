const express = require('express');
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');
const upload = multer({storage: multer.memoryStorage()});

const router = express.Router();

router.post('/create', authMiddleware, upload.single("image"), postController.createPost);
router.get('/feed', postController.getFeed);
router.get('/user/:username', postController.getUserPosts);
router.put('/like/:id', authMiddleware, postController.toggleLike);
router.post('/comment/:id', authMiddleware, postController.addComment);
router.post('/save/:id', authMiddleware, postController.toggleSavePost);
router.get('/saved/me', authMiddleware, postController.getSavedPosts);
router.get('/explore', postController.getExploreFeed);
router.get('/search/hashtag/:tag', postController.searchByHashtag);

module.exports = router;
