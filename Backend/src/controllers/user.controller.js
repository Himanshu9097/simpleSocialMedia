const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Notification = require('../models/notification.model');
const { getReceiverSocketId, getIo } = require('../socket');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await userModel.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with that email or username" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await userModel.create({
            username,
            email,
            password: hashedPassword
        });

        const token = jwt.sign({ id: newUser._id, username: newUser.username }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: '7d' });

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                profilePic: newUser.profilePic
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: '7d' });

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePic: user.profilePic
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await userModel.findOne({ username })
            .select('-password')
            .populate('followers', 'username profilePic')
            .populate('following', 'username profilePic')
            .populate('followRequests', 'username profilePic');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // We will fetch posts for this user separately or bundle them here.
        // For now, returning just user info
        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const uploadFile = require('../services/storage.service');

exports.toggleFollow = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user.id;

        if (targetUserId === currentUserId) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const targetUser = await userModel.findById(targetUserId);
        const currentUser = await userModel.findById(currentUserId);

        if (!targetUser || !currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const isFollowing = currentUser.following.includes(targetUserId);
        const hasRequested = targetUser.followRequests.includes(currentUserId);

        if (isFollowing) {
            // Unfollow
            currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
            await currentUser.save();
            await targetUser.save();
            return res.status(200).json({ message: "Unfollowed successfully", status: "not_following" });
        } else {
            // Instant Follow (Bypassing requests for public profiles)
            currentUser.following.push(targetUserId);
            targetUser.followers.push(currentUserId);
            await currentUser.save();
            await targetUser.save();

            const notification = await Notification.create({
                recipient: targetUserId,
                sender: currentUserId,
                type: 'follow'
            });
            const populatedNotif = await notification.populate('sender', 'username profilePic');
            const receiverSocketId = getReceiverSocketId(targetUserId.toString());
            if (receiverSocketId) {
                getIo().to(receiverSocketId).emit('newNotification', populatedNotif);
            }

            return res.status(200).json({ message: "Followed successfully", status: "following" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

exports.acceptRequest = async (req, res) => {
    try {
        const requesterId = req.params.id;
        const currentUserId = req.user.id;

        const currentUser = await userModel.findById(currentUserId);
        const requester = await userModel.findById(requesterId);

        if (!currentUser || !requester) return res.status(404).json({ message: "User not found" });

        if (!currentUser.followRequests.includes(requesterId)) {
            return res.status(400).json({ message: "No follow request from this user" });
        }

        // Accept the request: add to followers/following, remove from requests
        currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
        currentUser.followers.push(requesterId);
        requester.following.push(currentUserId);

        await currentUser.save();
        await requester.save();

        return res.status(200).json({ message: "Follow request accepted" });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

exports.rejectRequest = async (req, res) => {
    try {
        const requesterId = req.params.id;
        const currentUserId = req.user.id;

        const currentUser = await userModel.findById(currentUserId);
        
        if (!currentUser) return res.status(404).json({ message: "User not found" });

        currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
        
        await currentUser.save();

        return res.status(200).json({ message: "Follow request rejected" });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

exports.updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Image is required" });

        const result = await uploadFile(req.file.buffer);
        const user = await userModel.findByIdAndUpdate(req.user.id, { profilePic: result.url }, { new: true });

        return res.status(200).json({
            message: "Profile picture updated",
            profilePic: user.profilePic
        });
    } catch (error) {
         return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getConnections = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId).populate('following', 'username profilePic').populate('followers', 'username profilePic');
        
        if (!user) return res.status(404).json({ message: "User not found" });

        // Connections are users who follow you AND you follow them back
        const followingIds = user.following.map(f => f._id.toString());
        const connections = user.followers.filter(f => followingIds.includes(f._id.toString()));

        return res.status(200).json({ connections });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(200).json({ users: [] });

        const users = await userModel.find({ 
            username: { $regex: query, $options: 'i' } 
        }).select('username profilePic');
        
        return res.status(200).json({ users });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
