import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, Grid, Bookmark, Users, Camera, Check, X, Trash2 } from 'lucide-react';
import './Profile.css';

const Profile = () => {
    let { username } = useParams();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    if (username === 'me') {
        username = currentUser.username;
    }

    const [userProfile, setUserProfile] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [userSavedPosts, setUserSavedPosts] = useState([]);
    const [userStories, setUserStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [followStatus, setFollowStatus] = useState('Follow'); // Follow, Requested, Following
    const [isMutual, setIsMutual] = useState(false);
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [modalType, setModalType] = useState('followers');
    const [activeTab, setActiveTab] = useState('POSTS');
    const fileInputRef = useRef(null);
    const storyFileInputRef = useRef(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch profile
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/profile/${username}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setUserProfile(data.user);

                const isFollowing = data.user.followers.some(f => f._id === currentUser.id);
                const hasRequested = data.user.followRequests?.some(r => r._id === currentUser.id);
                const isFollowedBy = data.user.following.some(f => f._id === currentUser.id);

                if (isFollowing) setFollowStatus('Following');
                else if (hasRequested) setFollowStatus('Requested');
                else setFollowStatus('Follow');

                setIsMutual(isFollowing && isFollowedBy);

                // Fetch posts
                const postsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/posts/user/${username}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserPosts(postsRes.data.posts);

                // Fetch stories
                try {
                    const storiesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/stories/user/${username}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUserStories(storiesRes.data.stories);
                } catch (err) {
                    console.error("Could not fetch stories");
                }

                // Fetch saved posts for own profile
                if (data.user._id === currentUser.id) {
                    try {
                        const savedRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/posts/saved/me`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setUserSavedPosts(savedRes.data.savedPosts);
                    } catch (err) {
                        console.error("Could not fetch saved posts");
                    }
                }

            } catch (error) {
                console.error("Failed to fetch profile data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [username]);

    const handleProfilePicChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/profile-picture`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setUserProfile(prev => ({ ...prev, profilePic: data.profilePic }));

            // Also update local storage
            const updatedUser = { ...currentUser, profilePic: data.profilePic };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error("Failed to update profile picture", error);
        } finally {
            setUploading(false);
        }
    };

    const handleStoryUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/stories/create`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setUserStories(prev => [data.story, ...prev]);
        } catch (error) {
            console.error("Failed to post story", error);
        } finally {
            setUploading(false);
        }
    };

    const handleToggleFollow = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/follow/${userProfile._id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.status === 'requested') setFollowStatus('Requested');
            else if (data.status === 'following') setFollowStatus('Following');
            else if (data.status === 'not_following') setFollowStatus('Follow');
        } catch (error) {
            console.error("Follow error", error);
        }
    };

    const handleAcceptRequest = async (requesterId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/users/accept-request/${requesterId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remove from list
            setUserProfile(prev => ({
                ...prev,
                followRequests: prev.followRequests.filter(r => r._id !== requesterId),
                followers: [...prev.followers, { _id: requesterId }] // basic mock addition
            }));
        } catch (error) {
            console.error("Error accepting request", error);
        }
    };

    const handleRejectRequest = async (requesterId) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/reject-request/${requesterId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remove from list
            setUserProfile(prev => ({
                ...prev,
                followRequests: prev.followRequests.filter(r => r._id !== requesterId)
            }));
        } catch (error) {
            console.error("Error rejecting request", error);
        }
    };

    const handleDeleteStory = async (storyId) => {
        if (!window.confirm("Delete this story?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/stories/${storyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserStories(prev => prev.filter(s => s._id !== storyId));
        } catch (error) {
            console.error("Failed to delete story", error);
        }
    };

    if (loading) return (
        <div className="loader-container">
            <div className="spinner"></div>
        </div>
    );

    const isOwnProfile = currentUser.username === username;

    return (
        <div className="profile-container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header className="profile-header glass-panel">
                <div
                    className="profile-avatar-large"
                    style={{ position: 'relative', cursor: isOwnProfile ? 'pointer' : 'default' }}
                    onClick={() => isOwnProfile && fileInputRef.current?.click()}
                >
                    {userProfile?.profilePic ? (
                        <img src={userProfile.profilePic} alt="Profile" style={{ opacity: uploading ? 0.5 : 1 }} />
                    ) : (
                        <div className="avatar-placeholder">{userProfile?.username?.[0]?.toUpperCase() || 'U'}</div>
                    )}

                    {isOwnProfile && (
                        <div className="avatar-overlay">
                            <Camera size={24} />
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleProfilePicChange}
                />

                <div className="profile-info">
                    <div className="profile-actions-row">
                        <h2 className="heading-2">{userProfile?.username}</h2>
                        {isOwnProfile ? (
                            <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Edit Profile</button>
                        ) : (
                            <>
                                <button
                                    className={followStatus === 'Follow' ? 'btn-primary' : 'btn-secondary'}
                                    onClick={handleToggleFollow}
                                    style={{ padding: '0.5rem 1.5rem' }}
                                >
                                    {followStatus}
                                </button>
                                {followStatus === 'Following' && (
                                    <button
                                        className="btn-secondary"
                                        onClick={() => navigate('/messages', { state: { directUser: userProfile } })}
                                        style={{ padding: '0.5rem 1.5rem' }}
                                    >
                                        Message
                                    </button>
                                )}
                            </>
                        )}
                        <button className="icon-btn"><Settings size={22} /></button>
                    </div>

                    <div className="profile-stats">
                        <div className="stat">
                            <strong>{userPosts.length}</strong> posts
                        </div>
                        <div className="stat" style={{ cursor: 'pointer' }} onClick={() => { setModalType('followers'); setShowFollowModal(true); }}>
                            <strong>{userProfile?.followers?.length || 0}</strong> followers
                        </div>
                        <div className="stat" style={{ cursor: 'pointer' }} onClick={() => { setModalType('following'); setShowFollowModal(true); }}>
                            <strong>{userProfile?.following?.length || 0}</strong> following
                        </div>
                    </div>
                </div>
            </header>

            <div className="stories-container" style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', padding: '1rem 0', marginBottom: '1.5rem', scrollbarWidth: 'none' }}>
                {isOwnProfile && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flexShrink: 0 }} onClick={() => storyFileInputRef.current?.click()}>
                        <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px dashed var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.05)' }}>
                            <span style={{ fontSize: '2rem', color: 'var(--text-secondary)' }}>+</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Add Story</span>
                        <input type="file" ref={storyFileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleStoryUpload} />
                    </div>
                )}

                {userStories.map(story => {
                    const diffMs = new Date() - new Date(story.createdAt);
                    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                    const timeLabel = diffHrs > 0 ? `${diffHrs}h` : 'New';

                    return (
                        <div key={story._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flexShrink: 0, position: 'relative' }}>
                            {isOwnProfile && (
                                <button
                                    onClick={() => handleDeleteStory(story._id)}
                                    style={{
                                        position: 'absolute', top: '-5px', right: '-5px',
                                        background: 'rgba(239, 68, 68, 0.9)', border: 'none',
                                        borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '4px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                                    }}>
                                    <Trash2 size={12} />
                                </button>
                            )}
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '3px solid #f472b6', padding: '2px' }}>
                                <img src={story.image} alt="story" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{timeLabel}</span>
                        </div>
                    );
                })}
            </div>

            {isOwnProfile && userProfile?.followRequests?.length > 0 && (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3 className="heading-2" style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Follow Requests</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {userProfile.followRequests.map(reqUser => (
                            <div key={reqUser._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className="post-avatar" style={{ border: '1px solid var(--border-color)' }}>
                                        {reqUser.profilePic ? (
                                            <img src={reqUser.profilePic} alt="pic" />
                                        ) : (
                                            <div className="avatar-placeholder" style={{ fontSize: '1rem' }}>{reqUser.username?.[0]?.toUpperCase()}</div>
                                        )}
                                    </div>
                                    <span style={{ fontWeight: 600 }}>{reqUser.username}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn-primary" style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)' }} onClick={() => handleAcceptRequest(reqUser._id)}>
                                        <Check size={18} />
                                    </button>
                                    <button className="btn-secondary" style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)' }} onClick={() => handleRejectRequest(reqUser._id)}>
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="profile-tabs border-t border-glass-border">
                <div className={`tab ${activeTab === 'POSTS' ? 'active' : ''}`} onClick={() => setActiveTab('POSTS')}><Grid size={18} /> POSTS</div>
                <div className={`tab ${activeTab === 'SAVED' ? 'active' : ''}`} onClick={() => setActiveTab('SAVED')}><Bookmark size={18} /> SAVED</div>
                <div className={`tab ${activeTab === 'TAGGED' ? 'active' : ''}`} onClick={() => setActiveTab('TAGGED')}><Users size={18} /> TAGGED</div>
            </div>

            <div className="profile-grid">
                {activeTab === 'POSTS' && (
                    userPosts.length === 0 ? (
                        <div className="empty-profile-state" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📷</div>
                            <h2 className="heading-2" style={{ marginBottom: '0.5rem' }}>No Posts Yet</h2>
                            {isOwnProfile ? (
                                <p>When you share photos, they will appear on your profile.</p>
                            ) : (
                                <p>When they share photos, they will appear here.</p>
                            )}
                        </div>
                    ) : (
                        userPosts.map((post) => (
                            <div key={post._id} className="grid-item">
                                <div className="grid-overlay">
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>❤️ {post.likes?.length || 0}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>💬 {post.comments?.length || 0}</span>
                                </div>
                                <img src={post.image} alt="post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        ))
                    )
                )}

                {activeTab === 'SAVED' && (
                    isOwnProfile ? (
                        userSavedPosts.length === 0 ? (
                            <div className="empty-profile-state" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔖</div>
                                <h2 className="heading-2" style={{ marginBottom: '0.5rem' }}>Only you can see what you've saved</h2>
                                <p>Save photos and videos that you want to see again.</p>
                            </div>
                        ) : (
                            userSavedPosts.map((post) => (
                                <div key={post._id} className="grid-item">
                                    <div className="grid-overlay">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>❤️ {post.likes?.length || 0}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>💬 {post.comments?.length || 0}</span>
                                    </div>
                                    <img src={post.image} alt="post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))
                        )
                    ) : (
                        <div className="empty-profile-state" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
                            <h2 className="heading-2" style={{ marginBottom: '0.5rem' }}>Saved Posts are Private</h2>
                            <p>You cannot view another user's saved posts.</p>
                        </div>
                    )
                )}

                {activeTab === 'TAGGED' && (
                    <div className="empty-profile-state" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🖼️</div>
                        <h2 className="heading-2" style={{ marginBottom: '0.5rem' }}>Photos of You</h2>
                        <p>When people tag you in photos, they'll appear here.</p>
                    </div>
                )}
            </div>

            {showFollowModal && (
                <div className="story-viewer-modal animate-fade-in" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)'
                }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', maxHeight: '70vh', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 className="heading-2" style={{ textTransform: 'capitalize' }}>{modalType}</h3>
                            <X size={24} style={{ cursor: 'pointer' }} onClick={() => setShowFollowModal(false)} />
                        </div>
                        <div style={{ overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {userProfile?.[modalType]?.length === 0 ? (
                                <p className="text-muted text-center">No users found.</p>
                            ) : (
                                userProfile?.[modalType]?.map(u => (
                                    <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => {
                                        setShowFollowModal(false);
                                        navigate(`/profile/${u.username}`);
                                    }}>
                                        <div className="connection-avatar" style={{ width: '40px', height: '40px', border: '1px solid var(--glass-border)' }}>
                                            {u.profilePic ? (
                                                <img src={u.profilePic} alt={u.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div className="avatar-placeholder">{u.username?.[0]?.toUpperCase()}</div>
                                            )}
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{u.username}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
