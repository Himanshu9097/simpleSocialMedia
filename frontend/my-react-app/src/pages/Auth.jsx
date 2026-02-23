import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const MAX_SAVED = 5;

const getSavedUsers = () => {
    try {
        return JSON.parse(localStorage.getItem('savedUsers') || '[]');
    } catch {
        return [];
    }
};

const saveUser = (user) => {
    let saved = getSavedUsers().filter(u => u.id !== user.id);
    saved.unshift({ id: user.id, username: user.username, profilePic: user.profilePic });
    if (saved.length > MAX_SAVED) saved = saved.slice(0, MAX_SAVED);
    localStorage.setItem('savedUsers', JSON.stringify(saved));
};

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [savedUsers, setSavedUsers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        setSavedUsers(getSavedUsers());
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const url = isLogin
            ? `${import.meta.env.VITE_API_URL}/api/users/login`
            : `${import.meta.env.VITE_API_URL}/api/users/register`;

        try {
            const { data } = await axios.post(url, formData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            saveUser(data.user);
            navigate('/feed');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    const handleQuickLogin = (savedUser) => {
        // Pre-fill the email field with the username (user still needs password)
        setFormData(prev => ({ ...prev, email: savedUser.email || '', username: savedUser.username }));
        setIsLogin(true);
    };

    const handleRemoveSaved = (e, userId) => {
        e.stopPropagation();
        const updated = getSavedUsers().filter(u => u.id !== userId);
        localStorage.setItem('savedUsers', JSON.stringify(updated));
        setSavedUsers(updated);
    };

    return (
        <div className="auth-container">
            <div className="auth-wrapper animate-fade-in">

                {/* Saved Accounts Quick Access */}
                {savedUsers.length > 0 && (
                    <div className="saved-accounts-card glass-panel">
                        <h3 className="saved-accounts-title">Quick Access</h3>
                        <div className="saved-accounts-list">
                            {savedUsers.map(user => (
                                <div
                                    key={user.id}
                                    className="saved-account-item"
                                    onClick={() => handleQuickLogin(user)}
                                    title={`Login as @${user.username}`}
                                >
                                    <div className="saved-account-avatar">
                                        {user.profilePic ? (
                                            <img src={user.profilePic} alt={user.username} />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {user.username?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <span className="saved-account-username">@{user.username}</span>
                                    <button
                                        className="saved-account-remove"
                                        onClick={(e) => handleRemoveSaved(e, user.id)}
                                        title="Remove"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Login / Sign Up Card */}
                <div className="auth-card glass-panel">
                    <h1 className="logo-text text-center mb-6">{isLogin ? 'Login' : 'Sign Up'}</h1>
                    <h2 className="heading-2 mb-4">{isLogin ? 'Welcome Back' : 'Join Us'}</h2>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        {!isLogin && (
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                className="input-field"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        )}
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            className="input-field"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            className="input-field"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />

                        <button type="submit" className="btn-primary w-full mt-4">
                            {isLogin ? 'Log In' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="auth-switch">
                        <span className="text-muted">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                        </span>
                        <button className="btn-link" onClick={() => setIsLogin(!isLogin)}>
                            {isLogin ? 'Sign up' : 'Log in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
