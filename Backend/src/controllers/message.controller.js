const messageModel = require('../models/message.model');
const userModel = require('../models/user.model');

exports.getConversation = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.userId;

        const messages = await messageModel.find({
            $or: [
                { sender: currentUserId, receiver: targetUserId },
                { sender: targetUserId, receiver: currentUserId }
            ]
        }).sort({ createdAt: 1 });

        return res.status(200).json({
            message: "Conversation fetched successfully",
            messages
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.userId;
        const { text } = req.body;

        if (!text) {
             return res.status(400).json({ message: "Message text is required" });
        }

        // Optional: Check if users are following each other
        const currentUser = await userModel.findById(currentUserId);
        const targetUser = await userModel.findById(targetUserId);

        if (!targetUser) return res.status(404).json({ message: "User not found" });

        const isFollowingEachOther = currentUser.following.includes(targetUserId) && targetUser.following.includes(currentUserId);
        
        if (!isFollowingEachOther) {
             return res.status(403).json({ message: "You must follow each other to send messages" });
        }

        const newMessage = await messageModel.create({
            sender: currentUserId,
            receiver: targetUserId,
            text
        });

        return res.status(201).json({
            message: "Message sent",
            chat: newMessage
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
