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
        }).sort({ createdAt: 1 }).lean();

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

        // We assume token implies current user exists. Skip finding current user to save DB ms.
        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ message: "Invalid target user id" });
        }

        const targetExists = await userModel.exists({ _id: targetUserId });
        if (!targetExists) return res.status(404).json({ message: "User not found" });

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

        // Run notification creation in the background so it doesn't block the API response
        Notification.create({
            recipient: targetUserId,
            sender: currentUserId,
            type: 'message',
            message: text.substring(0, 30) // short snippet
        }).then(async (notification) => {
            if (receiverSocketId) {
                const populatedNotif = await notification.populate('sender', 'username profilePic');
                getIo().to(receiverSocketId).emit('newNotification', populatedNotif);
            }
        }).catch(err => console.error('Notification failed:', err));

        return res.status(201).json({
            message: "Message sent",
            chat: newMessage
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
