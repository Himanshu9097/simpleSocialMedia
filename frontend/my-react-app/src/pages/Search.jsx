import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import './Search.css';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(`http://localhost:3000/api/users/search?query=${query}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setResults(data.users);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchResults, 300);
        return () => clearTimeout(debounceTimer);
    }, [query]);

    return (
        <div className="search-container animate-fade-in">
            <h2 className="heading-1">Explore Users</h2>

            <div className="search-bar glass-panel">
                <SearchIcon size={20} className="text-muted" />
                <input
                    type="text"
                    placeholder="Search for username..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="search-input"
                    autoFocus
                />
            </div>

            <div className="search-results">
                {loading && <p className="text-muted" style={{ padding: '1rem' }}>Searching...</p>}
                {!loading && query.trim() && results.length === 0 && (
                    <p className="text-muted" style={{ padding: '1rem' }}>No users found for "{query}"</p>
                )}

                {results.map(user => (
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
        </div>
    );
};

export default Search;
