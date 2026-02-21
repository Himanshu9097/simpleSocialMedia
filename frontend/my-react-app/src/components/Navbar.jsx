import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusSquare, User, LogOut, MessageSquare, Search as SearchIcon } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth';
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
                    <NavLink to="/create-post" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <PlusSquare size={24} />
                        <span className="nav-label">Create</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/messages" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <MessageSquare size={24} />
                        <span className="nav-label">Messages</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/profile/me" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <User size={24} />
                        <span className="nav-label">Profile</span>
                    </NavLink>
                </li>
            </ul>

            <div className="nav-bottom">
                <button className="nav-item btn-logout" onClick={handleLogout}>
                    <LogOut size={24} />
                    <span className="nav-label">Logout</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
