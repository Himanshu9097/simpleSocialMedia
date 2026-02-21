const storyModel = require('../models/story.model');
const userModel = require('../models/user.model');
const uploadFile = require('../services/storage.service');

exports.createStory = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Image is required for a story" });
        }

        const result = await uploadFile(req.file.buffer);

        const story = await storyModel.create({
            image: result.url,
            user: req.user.id
        });

        return res.status(201).json({
            message: "Story created successfully",
            story
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getUserStories = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.user.id;

        const targetUser = await userModel.findOne({ username });
        if (!targetUser) return res.status(404).json({ message: "User not found" });

        // Privacy check: only friends/followers can see if account is private
        if (targetUser.isPrivate && targetUser._id.toString() !== currentUserId) {
            const isFollower = targetUser.followers.includes(currentUserId);
            if (!isFollower) {
                 return res.status(403).json({ message: "Account is private. Follow to see stories", stories: [] });
            }
        }

        const stories = await storyModel.find({ user: targetUser._id }).sort({ createdAt: -1 });

        return res.status(200).json({ stories });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getFeedStories = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        // Find users whose stories we can see: public users OR private users we follow
        const validUsers = await userModel.find({
            $or: [
                { isPrivate: false },
                { isPrivate: true, followers: currentUserId },
                { _id: currentUserId } // Always see own
            ]
        }).select('_id');

        const validUserIds = validUsers.map(u => u._id);

        const stories = await storyModel.find({ user: { $in: validUserIds } })
            .populate('user', 'username profilePic')
            .sort({ createdAt: -1 });

        return res.status(200).json({ stories });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.deleteStory = async (req, res) => {
    try {
        const storyId = req.params.id;
        const currentUserId = req.user.id;

        const story = await storyModel.findById(storyId);
        if (!story) return res.status(404).json({ message: "Story not found" });

        if (story.user.toString() !== currentUserId) {
            return res.status(403).json({ message: "Not authorized to delete this story" });
        }

        await storyModel.findByIdAndDelete(storyId);
        return res.status(200).json({ message: "Story deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
