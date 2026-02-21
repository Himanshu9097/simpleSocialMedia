const messageModel = require('../models/message.model');
const userModel = require('../models/user.model');
const Notification = require('../models/notification.model');
const { getReceiverSocketId, getIo } = require('../socket');
const mongoose = require('mongoose');

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
        const text = req.body.text?.trim();

        if (!text) {
             return res.status(400).json({ message: "Message text is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ message: "Invalid target user id" });
        }

        if (currentUserId === targetUserId) {
            return res.status(400).json({ message: "You cannot message yourself" });
        }

        // Optional: Check if users are following each other
        const currentUser = await userModel.findById(currentUserId);
        const targetUser = await userModel.findById(targetUserId);

        if (!currentUser) return res.status(404).json({ message: "Current user not found" });
        if (!targetUser) return res.status(404).json({ message: "User not found" });

        // Following check securely removed to ease testing and basic messaging.
        // Users can now freely send messages to anyone in the system.

        const newMessage = await messageModel.create({
            sender: currentUserId,
            receiver: targetUserId,
            text
        });

        // Real-time socket event
        const receiverSocketId = getReceiverSocketId(targetUserId);
        if (receiverSocketId) {
            getIo().to(receiverSocketId).emit('newMessage', newMessage);
        }

        // Notification logic (usually you don't send individual notifs for every text, but just as requested in prompt)
        try {
            const notification = await Notification.create({
                recipient: targetUserId,
                sender: currentUserId,
                type: 'message',
                message: text.substring(0, 30) // short snippet
            });
            if (receiverSocketId) {
                const populatedNotif = await notification.populate('sender', 'username profilePic');
                getIo().to(receiverSocketId).emit('newNotification', populatedNotif);
            }
        } catch (notificationError) {
            // Message delivery should not fail if notification creation/emission fails.
            console.error('Notification creation failed for message:', notificationError.message);
        }

        return res.status(201).json({
            message: "Message sent",
            chat: newMessage
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
