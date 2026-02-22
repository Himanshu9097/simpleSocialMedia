import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Heart, MessageCircle } from 'lucide-react';
import './Search.css';

const Search = () => {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'tags'
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setUsers([]);
                setPosts([]);
                return;
            }

            setLoading(true);
            try {
                const token = localStorage.getItem('token');

                if (activeTab === 'users') {
                    const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/search?query=${query}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUsers(data.users);
                } else {
                    // Normalize hashtag by removing leading '#' if entered
                    const tag = query.startsWith('#') ? query.slice(1) : query;
                    // Don't search if tag is actually empty after slicing '#'
                    if (!tag) {
                        setPosts([]);
                        setLoading(false);
                        return;
                    }
                    const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/posts/search/hashtag/${tag}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setPosts(data.posts);
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchResults, 400);
        return () => clearTimeout(debounceTimer);
    }, [query, activeTab]);

    return (
        <div className="search-container animate-fade-in">
            <h2 className="heading-1" style={{ marginBottom: '1.5rem' }}>Search</h2>

            <div className="search-tabs">
                <button
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Users
                </button>
                <button
                    className={`tab-btn ${activeTab === 'tags' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tags')}
                >
                    Tags
                </button>
            </div>

            <div className="search-bar glass-panel">
                <SearchIcon size={20} className="text-muted" />
                <input
                    type="text"
                    placeholder={activeTab === 'users' ? "Search for username..." : "Search hashtags (e.g. #travel)..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="search-input"
                    autoFocus
                />
            </div>

            <div className="search-results">
                {loading && <p className="text-muted text-center" style={{ padding: '2rem' }}>Searching...</p>}

                {!loading && query.trim() && (
                    <>
                        {activeTab === 'users' ? (
                            users.length === 0 ? (
                                <p className="text-muted text-center" style={{ padding: '2rem' }}>No users found for "{query}"</p>
                            ) : (
                                <div className="users-list">
                                    {users.map(user => (
                                        <div
                                            key={user._id}
                                            className="search-result-item glass-panel"
                                            onClick={() => navigate(`/profile/${user.username}`)}
                                        >
                                            <div className="connection-avatar">
                                                {user.profilePic ? (
                                                    <img src={user.profilePic} alt={user.username} />
                                                ) : (
                                                    <div className="avatar-placeholder">{user.username?.[0]?.toUpperCase()}</div>
                                                )}
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{user.username}</span>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            posts.length === 0 && query.trim() !== '#' ? (
                                <p className="text-muted text-center" style={{ padding: '2rem' }}>No posts found for "{query}"</p>
                            ) : (
                                <div className="explore-grid" style={{ marginTop: '1rem' }}>
                                    {posts.map(post => (
                                        <div key={post._id} className="explore-item group" onClick={() => navigate(`/profile/${post.author.username}`)}>
                                            <img src={post.image} alt="Hashtag match" className="explore-image" />
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
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Search;
