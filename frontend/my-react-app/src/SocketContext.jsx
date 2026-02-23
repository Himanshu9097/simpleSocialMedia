import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadMessagesFrom, setUnreadMessagesFrom] = useState(new Set());
    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        if (user) {
            const newSocket = io(import.meta.env.VITE_API_URL, {
                query: { userId: user.id }
            });
            setSocket(newSocket);

            return () => newSocket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user?.id]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter(n => !n.isRead).length);
            } catch (error) {
                console.error("Failed to fetch notifications");
            }
        };

        if (user) {
            fetchNotifications();
        }
    }, [user?.id]);

    useEffect(() => {
        if (socket) {
            // Listen for real-time notifications (likes, follows, comments)
            socket.on("newNotification", (notif) => {
                setNotifications(prev => [notif, ...prev]);
                if (notif.type !== 'message') {
                    setUnreadCount(prev => prev + 1);
                } else {
                    // Use sender._id if object, or sender if plain string
                    const senderId = notif.sender?._id || notif.sender;
                    if (senderId) {
                        setUnreadMessagesFrom(prev => new Set(prev).add(senderId.toString()));
                    }
                }
            });

            // Also listen to the newMessage event directly for the unread dot
            // (fires when you receive a message while NOT on the messages page)
            socket.on("newMessage", (message) => {
                const currentPath = window.location.pathname;
                if (!currentPath.includes('/messages')) {
                    setUnreadMessagesFrom(prev => new Set(prev).add(message.sender.toString()));
                }
            });
        }
        return () => {
            socket?.off("newNotification");
            socket?.off("newMessage");
        };
    }, [socket]);

    const markAsRead = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${import.meta.env.VITE_API_URL}/api/notifications/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Failed to mark as read");
        }
    }

    const clearUnreadMessageFrom = (senderId) => {
        setUnreadMessagesFrom(prev => {
            const newSet = new Set(prev);
            newSet.delete(senderId);
            return newSet;
        });
    };

    return (
        <SocketContext.Provider value={{ socket, notifications, unreadCount, unreadMessagesFrom, markAsRead, clearUnreadMessageFrom }}>
            {children}
        </SocketContext.Provider>
    );
};
