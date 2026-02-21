const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['like', 'comment', 'follow', 'message'],
        required: true
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // Optional (for likes/comments)
    message: { type: String }, // Optional snippet of message or comment text
    isRead: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
