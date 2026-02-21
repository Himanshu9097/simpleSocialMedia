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
                setUnreadCount(prev => prev + 1);
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

    return (
        <SocketContext.Provider value={{ socket, notifications, unreadCount, markAsRead }}>
            {children}
        </SocketContext.Provider>
    );
};
