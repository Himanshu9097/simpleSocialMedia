import React, { useState, memo } from 'react';
import { Heart, MessageCircle, Bookmark, Send } from 'lucide-react';
import axios from 'axios';
import './PostCard.css';

const PostCard = ({ post }) => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const initialLikes = post.likes || [];
    const [likesCount, setLikesCount] = useState(initialLikes.length);
    const [hasLiked, setHasLiked] = useState(
        initialLikes.some(id => (id?._id || id)?.toString() === user?.id)
    );
    const [hasSaved, setHasSaved] = useState(user?.savedPosts?.includes(post._id) || false);
    const [comments, setComments] = useState(post.comments || []);
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [showHeart, setShowHeart] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        const link = `${window.location.origin}/profile/${post.author?.username}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDoubleTap = () => {
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 1000);
        if (!hasLiked) {
            handleLike();
        }
    };

    const handleLike = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.put(`${import.meta.env.VITE_API_URL}/api/posts/like/${post._id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLikesCount(data.likes);
            setHasLiked(data.hasLiked);
        } catch (error) {
            console.error("Failed to toggle like", error);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/posts/save/${post._id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHasSaved(data.isSaved);

            const currentUser = JSON.parse(localStorage.getItem('user')) || {};
            if (!currentUser.savedPosts) currentUser.savedPosts = [];

            if (data.isSaved) {
                currentUser.savedPosts.push(post._id);
            } else {
                currentUser.savedPosts = currentUser.savedPosts.filter(id => id !== post._id);
            }
            localStorage.setItem('user', JSON.stringify(currentUser));
        } catch (error) {
            console.error("Failed to toggle save", error);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/posts/comment/${post._id}`, { text: commentText }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments([...comments, data.comment]);
            setCommentText('');
        } catch (error) {
            console.error("Failed to add comment", error);
        }
    };

    return (
        <div className="post-card glass-panel">
            <div className="post-header">
                <div className="post-avatar">
                    {post.author?.profilePic ? (
                        <img src={post.author.profilePic} alt="Author" />
                    ) : (
                        <div className="avatar-placeholder">{post.author?.username?.[0]?.toUpperCase()}</div>
                    )}
                </div>
                <div className="post-author">{post.author?.username || 'Unknown User'}</div>
            </div>

            <div className="post-image-container" style={{ position: 'relative' }}>
                <img src={post.image} alt="Post content" className="post-image" onDoubleClick={handleDoubleTap} style={{ cursor: 'pointer' }} />
                {showHeart && (
                    <div className="floating-heart animate">
                        <Heart size={100} fill="white" color="white" />
                    </div>
                )}
            </div>

            <div className="post-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button className={`action-btn ${hasLiked ? 'liked' : ''}`} onClick={handleLike}>
                        <Heart size={28} fill={hasLiked ? "var(--accent-color)" : "none"} color={hasLiked ? "var(--accent-color)" : "currentColor"} className={hasLiked ? "anim-pop" : ""} />
                    </button>
                    <button className="action-btn" onClick={() => setShowComments(!showComments)}>
                        <MessageCircle size={28} />
                    </button>
                    <button className="action-btn" onClick={handleCopyLink} title="Copy Link">
                        {copied ? <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>Copied!</span> : <Send size={28} />}
                    </button>
                </div>
                <button className="action-btn" onClick={handleSave}>
                    <Bookmark size={28} fill={hasSaved ? "var(--text-color)" : "none"} color={hasSaved ? "var(--text-color)" : "currentColor"} className={hasSaved ? "anim-pop" : ""} />
                </button>
            </div>

            <div className="post-likes">
                {likesCount} {likesCount === 1 ? 'like' : 'likes'}
            </div>

            <div className="post-caption">
                <span className="author-name">{post.author?.username}</span> {post.caption}
            </div>

            {showComments && (
                <div className="post-comments-section animate-fade-in">
                    <div className="comments-list">
                        {comments.map((c, i) => (
                            <div key={i} className="comment">
                                <span className="comment-author">{c.user?.username}</span>
                                <span className="comment-text">{c.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={handleComment} className="comment-form">
                <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="comment-input"
                />
                <button type="submit" className="comment-btn" disabled={!commentText.trim()}>Post</button>
            </form>
        </div>
    );
};

export default memo(PostCard);
