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
            socket.on("newNotification", (notif) => {
                setNotifications(prev => [notif, ...prev]);
                if (notif.type !== 'message') {
                    setUnreadCount(prev => prev + 1);
                } else {
                    setUnreadMessagesFrom(prev => new Set(prev).add(notif.sender._id));
                }
            });
        }
        return () => socket?.off("newNotification");
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
