import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusSquare, User, LogOut, MessageSquare, Search as SearchIcon, Heart, Compass } from 'lucide-react';
import { useSocket } from '../SocketContext';
import './Navbar.css';

const Navbar = () => {
    const { notifications, unreadCount, markAsRead, unreadMessagesFrom } = useSocket();
    const [showNotifs, setShowNotifs] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth';
    };

    const toggleNotifs = () => {
        if (!showNotifs && unreadCount > 0) {
            markAsRead();
        }
        setShowNotifs(!showNotifs);
    };

    return (
        <nav className="navbar glass-panel">
            <div className="nav-brand">
                <h1 className="logo-text">Instagram</h1>
            </div>

            <ul className="nav-links">
                <li>
                    <NavLink to="/feed" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <Home size={24} />
                        <span className="nav-label">Home</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/search" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <SearchIcon size={24} />
                        <span className="nav-label">Search</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/explore" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <Compass size={24} />
                        <span className="nav-label">Explore</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/create-post" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <PlusSquare size={24} />
                        <span className="nav-label">Create</span>
                    </NavLink>
                </li>
                <li style={{ position: 'relative' }}>
                    <NavLink to="/messages" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <div style={{ position: 'relative' }}>
                            <MessageSquare size={24} />
                            {unreadMessagesFrom.size > 0 && (
                                <span style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '10px', height: '10px' }} />
                            )}
                        </div>
                        <span className="nav-label">Messages</span>
                    </NavLink>
                </li>
                <li style={{ position: 'relative' }}>
                    <div className={`nav-item ${showNotifs ? 'active' : ''}`} onClick={toggleNotifs} style={{ cursor: 'pointer' }}>
                        <div style={{ position: 'relative' }}>
                            <Heart size={24} />
                            {unreadCount > 0 && (
                                <span style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <span className="nav-label">Notifications</span>
                    </div>

                    {showNotifs && (
                        <div className="notif-dropdown glass-panel animate-fade-in" style={{ position: 'absolute', left: '100%', top: 0, width: '300px', maxHeight: '400px', overflowY: 'auto', zIndex: 1000, padding: '1rem', marginLeft: '1rem' }}>
                            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Notifications</h3>
                            {notifications.length === 0 ? (
                                <p className="text-muted" style={{ fontSize: '0.9rem' }}>No new notifications.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {notifications.map(n => (
                                        <div key={n._id || Math.random()} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.9rem' }}>
                                            <div style={{ width: '35px', height: '35px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                                                {n.sender?.profilePic ? (
                                                    <img src={n.sender.profilePic} alt={n.sender.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', background: 'grey', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n.sender?.username?.[0]?.toUpperCase()}</div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <strong>{n.sender?.username}</strong>
                                                {n.type === 'like' && ' liked your post.'}
                                                {n.type === 'comment' && ` commented: "${n.message}"`}
                                                {n.type === 'message' && ` sent a message: "${n.message}"`}
                                                {n.type === 'follow' && ' requested to follow you.'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </li>
                <li>
                    <NavLink to="/profile/me" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <User size={24} />
                        <span className="nav-label">Profile</span>
                    </NavLink>
                </li>
            </ul>

            <div className="nav-bottom">
                {currentUser && (
                    <NavLink to="/profile/me" className="nav-user-profile">
                        <div className="nav-user-avatar">
                            {currentUser.profilePic ? (
                                <img src={currentUser.profilePic} alt={currentUser.username} />
                            ) : (
                                <div className="avatar-placeholder">{currentUser.username?.[0]?.toUpperCase()}</div>
                            )}
                        </div>
                        <span className="nav-label nav-user-name">{currentUser.username}</span>
                    </NavLink>
                )}
                <button className="nav-item btn-logout" onClick={handleLogout}>
                    <LogOut size={24} />
                    <span className="nav-label">Logout</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
