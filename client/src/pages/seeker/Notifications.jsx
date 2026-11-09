import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Info, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
    // Notifications state handling
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user.token;

    const fetchNotifications = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('http://localhost:5000/api/notifications', config);
            // Only show unread notifications (Inbox Zero style)
            setNotifications(data.filter(n => !n.read));
            setLoading(false);
        } catch (error) {
            console.error("Error fetching notifications", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchNotifications();
        } else {
            setLoading(false);
        }
    }, [token]);

    const handleNotificationClick = async (notif) => {
        // 1. Mark as read if not already
        if (!notif.read) {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.put(`http://localhost:5000/api/notifications/${notif.id}/read`, {}, config);

                // Remove from list immediately (Inbox Zero)
                setNotifications(prev => prev.filter(n => n.id !== notif.id));
            } catch (error) {
                console.error("Error marking as read", error);
            }
        }

        // 2. Navigate if link exists
        if (notif.relatedLink) {
            navigate(notif.relatedLink);
        }
    };

    const clearAll = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            await axios.put(`http://localhost:5000/api/notifications/read-all`, {}, config);
            setNotifications([]); // Clear interface immediately
        } catch (error) {
            console.error("Error marking all as read", error);
        }
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'status_update': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'message': return <MessageSquare className="w-5 h-5 text-blue-500" />;
            case 'alert': return <Info className="w-5 h-5 text-yellow-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    if (loading) return <div className="p-10 text-center">Loading notifications...</div>;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                {notifications.length > 0 && (
                    <button
                        onClick={clearAll}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                // Empty State
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center flex flex-col items-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Bell className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No new notifications</h3>
                    <p className="text-gray-500 max-w-sm">
                        You're all caught up! Check back later for updates on your applications and messages.
                    </p>
                </div>
            ) : (
                // Notification List
                <div className="space-y-3">
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4 transition-all hover:shadow-md cursor-pointer group
                                ${!notif.read ? 'bg-blue-50/50 border-blue-100' : ''}
                            `}
                        >
                            <div className={`mt-1 flex-shrink-0`}>
                                {getIcon(notif.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-semibold text-gray-800 ${!notif.read ? 'text-black' : 'text-gray-700'}`}>
                                        {notif.title}
                                    </h4>
                                    <span className="flex items-center text-xs text-gray-400 gap-1 whitespace-nowrap ml-2">
                                        <Clock className="w-3 h-3" /> {formatTime(notif.createdAt)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                    {notif.message}
                                </p>
                            </div>

                            {/* Right side indicator */}
                            <div className="self-center flex flex-col items-end gap-2">
                                {!notif.read && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                                {notif.relatedLink && (
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
