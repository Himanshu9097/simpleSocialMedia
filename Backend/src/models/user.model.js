const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: ""
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    followRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    isPrivate: {
        type: Boolean,
        default: false
    },
    savedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post'
    }]
}, { timestamps: true });

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
