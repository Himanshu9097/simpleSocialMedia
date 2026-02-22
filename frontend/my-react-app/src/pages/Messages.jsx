import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Messages.css';
import { Send, Plus, X, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../SocketContext';

const Messages = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [connections, setConnections] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/connections/all`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fetched = data.connections || [];

                // Deep-link check
                const directUser = location.state?.directUser;
                if (directUser) {
                    setActiveChat(directUser);
                    // Add them to connection list if they aren't already there
                    if (!fetched.some(u => u._id === directUser._id)) {
                        fetched.unshift(directUser);
                    }
                    // clear the state so refreshes don't auto-open it unless re-navigated
                    window.history.replaceState({}, document.title);
                }

                setConnections(fetched);
            } catch (error) {
                console.error("Failed to load connections", error);
            }
        };
        fetchConnections();
    }, []);

    useEffect(() => {
        if (activeChat) {
            fetchMessages();
        }
    }, [activeChat]);

    const { socket, unreadMessagesFrom, clearUnreadMessageFrom } = useSocket();

    useEffect(() => {
        if (activeChat) {
            clearUnreadMessageFrom(activeChat._id);
        }
    }, [activeChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (socket) {
            socket.on("newMessage", (message) => {
                if (activeChat && (message.sender === activeChat._id || message.receiver === activeChat._id)) {
                    setMessages(prev => [...prev, message]);
                }
            });
        }
        return () => socket?.off("newMessage");
    }, [socket, activeChat]);

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
            const backendMessage = error?.response?.data?.message;
            alert(backendMessage || "Could not send message. Please try again.");
        }
    };

    const handleSearchUsers = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/search?query=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter out self
            const filtered = data.users.filter(u => u._id !== currentUser.id);
            setSearchResults(filtered);
        } catch (error) {
            console.error("Search failed", error);
        }
    };

    const startNewChat = (user) => {
        setActiveChat(user);
        setShowNewChatModal(false);
        setSearchQuery('');
        setSearchResults([]);
        if (!connections.some(u => u._id === user._id)) {
            setConnections(prev => [user, ...prev]);
        }
    };

    return (
        <div className="messages-container animate-fade-in">
            <div className="glass-panel messages-layout">
                {/* Sidebar */}
                <div className="messages-sidebar">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <h2 className="heading-2" style={{ margin: 0 }}>Messages</h2>
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem' }} onClick={() => setShowNewChatModal(true)}>
                            <Plus size={16} /> New Check
                        </button>
                    </div>
                    <ul className="connection-list">
                        {connections.length === 0 ? (
                            <li className="p-4 text-muted text-center" style={{ padding: '1rem' }}>No connections yet.</li>
                        ) : (
                            connections.map(user => (
                                <li
                                    key={user._id}
                                    className={`connection-item ${activeChat?._id === user._id ? 'active' : ''}`}
                                    onClick={() => setActiveChat(user)}
                                    style={{ position: 'relative' }}
                                >
                                    <div className="connection-avatar">
                                        {user.profilePic ? (
                                            <img src={user.profilePic} alt={user.username} />
                                        ) : (
                                            <div className="avatar-placeholder">{user.username?.[0]?.toUpperCase()}</div>
                                        )}
                                    </div>
                                    <span style={{ fontWeight: 600 }}>{user.username}</span>
                                    {unreadMessagesFrom.has(user._id) && (
                                        <span style={{ position: 'absolute', right: '1rem', background: 'var(--accent-color)', width: '10px', height: '10px', borderRadius: '50%' }} />
                                    )}
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
                                    <div key={msg._id} className={`chat-bubble-wrapper ${msg.sender === currentUser.id ? 'sent' : 'received'}`} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === currentUser.id ? 'flex-end' : 'flex-start' }}>
                                        <div className="chat-bubble">
                                            {msg.text}
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', margin: '0 8px' }}>
                                            {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
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

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="story-viewer-modal animate-fade-in" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)'
                }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '450px', maxHeight: '70vh', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 className="heading-2">New Message</h3>
                            <X size={24} style={{ cursor: 'pointer' }} onClick={() => setShowNewChatModal(false)} />
                        </div>
                        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    placeholder="Search people..."
                                    value={searchQuery}
                                    onChange={handleSearchUsers}
                                    style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                />
                            </div>
                        </div>
                        <div style={{ overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                            {searchQuery && searchResults.length === 0 ? (
                                <p className="text-muted text-center">No users found.</p>
                            ) : (
                                searchResults.map(u => (
                                    <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius-md)', transition: 'background 0.2s' }} className="hover-highlight" onClick={() => startNewChat(u)}>
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

export default Messages;
