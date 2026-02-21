import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
            navigate('/feed');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass-panel animate-fade-in">
                <h1 className="logo-text text-center mb-6">Pulse</h1>
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
    );
};

export default Auth;
