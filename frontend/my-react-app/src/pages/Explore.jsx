import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import './Explore.css';

const Explore = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExplore = async () => {
            try {
                const token = localStorage.getItem('token');
                // Explore can technically be public but using token if protected
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/posts/explore`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                setPosts(data.posts || []);
            } catch (error) {
                console.error("Failed to load explore feed", error);
            } finally {
                setLoading(false);
            }
        };
        fetchExplore();
    }, []);

    if (loading) {
        return (
            <div className="loader-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="explore-container animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 className="heading-2" style={{ marginBottom: '2rem' }}>Explore</h2>

            {posts.length === 0 ? (
                <div className="glass-panel text-center text-muted" style={{ padding: '3rem' }}>
                    No posts found to explore yet.
                </div>
            ) : (
                <div className="explore-grid">
                    {posts.map(post => (
                        <div key={post._id} className="explore-item group" onClick={() => navigate(`/profile/${post.author.username}`)}>
                            <img src={post.image} alt="Explore content" className="explore-image" />
                            <div className="explore-overlay">
                                <div className="explore-stats">
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Heart size={20} fill="white" /> {post.likes?.length || 0}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <MessageCircle size={20} fill="white" /> {post.comments?.length || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Explore;
