const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');

const upload = multer({storage: multer.memoryStorage()});
const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile/:username', userController.getProfile);
router.post('/follow/:id', authMiddleware, userController.toggleFollow);
router.post('/accept-request/:id', authMiddleware, userController.acceptRequest);
router.post('/reject-request/:id', authMiddleware, userController.rejectRequest);
router.post('/profile-picture', authMiddleware, upload.single("image"), userController.updateProfilePicture);
router.get('/connections/all', authMiddleware, userController.getConnections);
router.get('/search', authMiddleware, userController.searchUsers);

module.exports = router;
