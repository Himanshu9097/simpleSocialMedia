const Notification = require('../models/notification.model');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.find({ recipient: userId })
            .populate('sender', 'username profilePic')
            .populate('post', 'image')
            .sort({ createdAt: -1 })
            .limit(20);
        
        return res.status(200).json({ notifications });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
        return res.status(200).json({ message: "Notifications marked as read" });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
