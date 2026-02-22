const postModel = require('../models/post.model');
const uploadFile = require('../services/storage.service');
const Notification = require('../models/notification.model');
const { getReceiverSocketId, getIo } = require('../socket');

exports.createPost = async (req, res) => {
    try {
        if (!req.file) {
             return res.status(400).json({ message: "Image is required" });
        }

        const result = await uploadFile(req.file.buffer);

        const caption = req.body.caption || "";
        const hashtags = caption.match(/#[a-zA-Z0-9_]+/g) || [];
        const cleanedHashtags = hashtags.map(tag => tag.slice(1).toLowerCase());

        const post = await postModel.create({
            image: result.url,
            caption: caption,
            hashtags: cleanedHashtags,
            author: req.user.id
        });

        await post.populate('author', 'username profilePic');

        return res.status(201).json({
            message: "Post created successfully",
            post
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getFeed = async (req, res) => {
    try {
        // Simple feed returning all posts sorted by newest
        const posts = await postModel.find()
            .sort({ createdAt: -1 })
            .populate('author', 'username profilePic')
            .populate('comments.user', 'username profilePic');

        return res.status(200).json({
            message: "Feed fetched successfully",
            posts
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.toggleLike = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await postModel.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const hasLiked = post.likes.some(id => id.toString() === userId);

        if (hasLiked) {
             // Unlike
             post.likes = post.likes.filter(id => id.toString() !== userId);
        } else {
             // Like
             post.likes.push(userId);
             if (post.author.toString() !== userId) {
                 const notification = await Notification.create({
                     recipient: post.author,
                     sender: userId,
                     type: 'like',
                     post: postId
                 });
                 const populatedNotif = await notification.populate('sender', 'username profilePic');
                 const receiverSocketId = getReceiverSocketId(post.author.toString());
                 if (receiverSocketId) {
                     getIo().to(receiverSocketId).emit('newNotification', populatedNotif);
                 }
             }
        }

        await post.save();
        return res.status(200).json({
            message: hasLiked ? "Unliked successfully" : "Liked successfully",
            likes: post.likes.length,
            hasLiked: !hasLiked
        });
    } catch (error) {
         return res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const { text } = req.body;

        if (!text) {
             return res.status(400).json({ message: "Comment text is required" });
        }

        const post = await postModel.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const newComment = {
            text,
            user: userId,
            createdAt: new Date()
        };

        post.comments.push(newComment);
        await post.save();

        await post.populate('comments.user', 'username profilePic');
        const populatedComment = post.comments[post.comments.length - 1];

        if (post.author.toString() !== userId) {
            const notification = await Notification.create({
                recipient: post.author,
                sender: userId,
                type: 'comment',
                post: postId,
                message: text.substring(0, 30)
            });
            const populatedNotif = await notification.populate('sender', 'username profilePic');
            const receiverSocketId = getReceiverSocketId(post.author.toString());
            if (receiverSocketId) {
                getIo().to(receiverSocketId).emit('newNotification', populatedNotif);
            }
        }

        return res.status(201).json({
            message: "Comment added successfully",
            comment: populatedComment
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getUserPosts = async (req, res) => {
    try {
        const { username } = req.params;
        const userModel = require('../models/user.model');
        const user = await userModel.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const posts = await postModel.find({ author: user._id })
            .sort({ createdAt: -1 })
            .populate('author', 'username profilePic')
            .populate('comments.user', 'username profilePic');

        return res.status(200).json({ posts });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.toggleSavePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const userModel = require('../models/user.model');

        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isSaved = user.savedPosts.includes(postId);

        if (isSaved) {
            user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
        } else {
            user.savedPosts.push(postId);
        }

        await user.save();

        return res.status(200).json({
            message: isSaved ? "Post unsaved" : "Post saved",
            isSaved: !isSaved
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getSavedPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const userModel = require('../models/user.model');
        const user = await userModel.findById(userId).populate({
            path: 'savedPosts',
            populate: [
                { path: 'author', select: 'username profilePic' },
                { path: 'comments.user', select: 'username profilePic' }
            ]
        });

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({ savedPosts: user.savedPosts });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getExploreFeed = async (req, res) => {
    try {
        const posts = await postModel.find()
            .populate('author', 'username profilePic')
            .populate('comments.user', 'username profilePic');
            
        // Sort in memory by likes length for simplicity, then by date
        posts.sort((a, b) => {
            if (b.likes.length === a.likes.length) {
                return b.createdAt - a.createdAt;
            }
            return b.likes.length - a.likes.length;
        });

        return res.status(200).json({ posts: posts.slice(0, 30) }); // Return top 30
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.searchByHashtag = async (req, res) => {
    try {
        const { tag } = req.params;
        const posts = await postModel.find({ hashtags: tag.toLowerCase() })
            .sort({ createdAt: -1 })
            .populate('author', 'username profilePic')
            .populate('comments.user', 'username profilePic');

        return res.status(200).json({ posts });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
