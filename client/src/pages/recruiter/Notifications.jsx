import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Info, MessageSquare, Clock, ArrowRight, Users, Briefcase } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RecruiterNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user.token;

    const fetchNotifications = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('http://localhost:5000/api/notifications', config);
            setNotifications(data.filter(n => !n.read));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notifications', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchNotifications();
        else setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const handleClick = async (notif) => {
        if (!notif.read) {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.put(
                    `http://localhost:5000/api/notifications/${notif.id}/read`, {}, config
                );
                setNotifications(prev => prev.filter(n => n.id !== notif.id));
            } catch (err) {
                console.error('Error marking as read', err);
            }
        }
        if (notif.relatedLink) navigate(notif.relatedLink);
    };

    const clearAll = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put('http://localhost:5000/api/notifications/read-all', {}, config);
            setNotifications([]);
        } catch (err) {
            console.error('Error marking all as read', err);
        }
    };

    const formatTime = (d) => new Date(d).toLocaleString();

    const getIcon = (type) => {
        switch (type) {
            case 'status_update': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'message': return <MessageSquare className="w-5 h-5 text-teal-500" />;
            case 'new_applicant': return <Users className="w-5 h-5 text-emerald-500" />;
            case 'job_update': return <Briefcase className="w-5 h-5 text-purple-500" />;
            case 'alert': return <Info className="w-5 h-5 text-yellow-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh] gap-3 text-gray-500 text-sm">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading notifications…
        </div>
    );

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {notifications.length > 0
                            ? `${notifications.length} unread notification${notifications.length > 1 ? 's' : ''}`
                            : 'All caught up'}
                    </p>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={clearAll}
                        className="text-sm text-teal-600 hover:text-teal-800 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-teal-50"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                        <Bell className="w-10 h-10 text-teal-200" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No new notifications</h3>
                    <p className="text-gray-500 max-w-sm leading-relaxed">
                        You're all caught up! New applicant activity, job updates, and messages will appear here.
                    </p>
                    <button
                        onClick={() => navigate('/recruiter/my-jobs')}
                        className="mt-6 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-teal-100"
                    >
                        View My Jobs
                    </button>
                </div>
            ) : (
                /* Notification List */
                <div className="space-y-3">
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => handleClick(notif)}
                            className={`bg-white p-4 rounded-xl border shadow-sm flex gap-4 transition-all hover:shadow-md cursor-pointer group
                                ${!notif.read ? 'border-teal-100 bg-teal-50/30' : 'border-gray-100'}
                            `}
                        >
                            <div className="mt-0.5 flex-shrink-0 w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
                                {getIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className={`font-semibold truncate ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {notif.title}
                                    </h4>
                                    <span className="flex items-center text-xs text-gray-400 gap-1 whitespace-nowrap shrink-0">
                                        <Clock className="w-3 h-3" /> {formatTime(notif.createdAt)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                    {notif.message}
                                </p>
                            </div>
                            <div className="self-center flex flex-col items-end gap-2 shrink-0">
                                {!notif.read && (
                                    <div className="w-2 h-2 bg-teal-600 rounded-full" />
                                )}
                                {notif.relatedLink && (
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecruiterNotifications;
