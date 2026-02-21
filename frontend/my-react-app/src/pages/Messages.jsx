import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Messages.css';
import { Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Messages = () => {
    const navigate = useNavigate();
    const [connections, setConnections] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const messagesEndRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/connections/all`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setConnections(data.connections);
            } catch (error) {
                console.error("Failed to load connections", error);
            }
        };
        fetchConnections();
    }, []);

    useEffect(() => {
        if (activeChat) {
            fetchMessages();
            // Optional: Set an interval for polling or implement WebSockets later
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [activeChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/${activeChat._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(data.messages);
        } catch (error) {
            console.error("Failed to load messages", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/messages/send/${activeChat._id}`,
                { text },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessages(prev => [...prev, data.chat]);
            setText('');
        } catch (error) {
            console.error("Failed to send message", error);
            alert("Could not send message. You guys must follow each other.");
        }
    };

    return (
        <div className="messages-container animate-fade-in">
            <div className="glass-panel messages-layout">
                {/* Sidebar */}
                <div className="messages-sidebar">
                    <h2 className="heading-2" style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>Messages</h2>
                    <ul className="connection-list">
                        {connections.length === 0 ? (
                            <li className="p-4 text-muted text-center" style={{ padding: '1rem' }}>No connections yet.</li>
                        ) : (
                            connections.map(user => (
                                <li
                                    key={user._id}
                                    className={`connection-item ${activeChat?._id === user._id ? 'active' : ''}`}
                                    onClick={() => setActiveChat(user)}
                                >
                                    <div className="connection-avatar">
                                        {user.profilePic ? (
                                            <img src={user.profilePic} alt={user.username} />
                                        ) : (
                                            <div className="avatar-placeholder">{user.username?.[0]?.toUpperCase()}</div>
                                        )}
                                    </div>
                                    <span style={{ fontWeight: 600 }}>{user.username}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {/* Chat Area */}
                <div className="chat-area">
                    {activeChat ? (
                        <>
                            <div className="chat-header">
                                <div
                                    className="connection-avatar"
                                    style={{ width: '40px', height: '40px', cursor: 'pointer' }}
                                    onClick={() => navigate(`/profile/${activeChat.username}`)}
                                >
                                    {activeChat.profilePic ? (
                                        <img src={activeChat.profilePic} alt={activeChat.username} />
                                    ) : (
                                        <div className="avatar-placeholder">{activeChat.username?.[0]?.toUpperCase()}</div>
                                    )}
                                </div>
                                <h3 className="heading-2" style={{ margin: 0, fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => navigate(`/profile/${activeChat.username}`)}>
                                    {activeChat.username}
                                </h3>
                            </div>

                            <div className="chat-history">
                                {messages.map(msg => (
                                    <div key={msg._id} className={`chat-bubble-wrapper ${msg.sender === currentUser.id ? 'sent' : 'received'}`}>
                                        <div className="chat-bubble">
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="chat-input-area" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Message..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    style={{ margin: 0, borderRadius: 'var(--radius-full)' }}
                                />
                                <button type="submit" className="send-btn" disabled={!text.trim()}>
                                    <Send size={20} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="chat-placeholder">
                            <Send size={48} color="var(--text-secondary)" />
                            <h3 className="heading-2" style={{ marginTop: '1rem' }}>Your Messages</h3>
                            <p className="text-muted">Select a friend to start chatting.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
