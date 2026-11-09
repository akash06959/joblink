import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Briefcase, LogOut, Link2, Bell, Menu, User, Grid, ArrowLeft, MessageCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ChatNotificationProvider, useChatNotifications } from './ChatNotificationContext';
import UserAvatar from './UserAvatar';

const RecruiterLayoutInner = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const { totalUnread, clearUnread } = useChatNotifications();
    const [notifCount, setNotifCount] = useState(0);

    /* Fetch unread notification count from API */
    const fetchNotifCount = useCallback(async () => {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (!u.token) return;
        try {
            const { data } = await axios.get('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${u.token}` }
            });
            setNotifCount(data.filter(n => !n.read).length);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        fetchNotifCount();
        const interval = setInterval(fetchNotifCount, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifCount]);

    /* Clear badges on relevant pages */
    useEffect(() => {
        if (location.pathname === '/recruiter/messages') clearUnread();
        if (location.pathname === '/recruiter/notifications') setNotifCount(0);
    }, [location.pathname, clearUnread]);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/recruiter/dashboard' },
        { icon: PlusCircle, label: 'Post Opportunity', path: '/recruiter/post-job' },
        { icon: Briefcase, label: 'My Opportunities', path: '/recruiter/my-jobs' },
        { icon: MessageCircle, label: 'Messages', path: '/recruiter/messages', badge: totalUnread },
    ];

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
            {/* TOP NAVBAR */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 px-4 md:px-8 h-16 flex items-center justify-between shadow-sm">

                {/* LEFT: Logo */}
                <div className="flex items-center gap-2">
                    <Link to="/recruiter/dashboard" className="flex items-center gap-2 group">
                        <div className="flex items-center justify-center w-10 h-10 bg-teal-600 rounded-xl text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                            <Link2 className="w-6 h-6 -rotate-45" />
                        </div>
                        <span className="font-bold text-2xl text-gray-800 tracking-tight hidden sm:block">
                            Job<span className="text-teal-600">Link</span> <span className="text-xs font-normal text-gray-500 ml-1 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">Recruiter</span>
                        </span>
                    </Link>
                </div>

                {/* RIGHT: Nav Links & Actions */}
                <div className="flex items-center gap-2 md:gap-6">

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-4 lg:gap-6 mr-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);

                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors relative py-5
                                        ${isActive ? 'text-teal-600' : 'text-gray-500 hover:text-gray-900'}
                                    `}
                                >
                                    <span className="relative">
                                        <Icon className={`w-4 h-4 ${isActive ? 'stroke-2' : 'stroke-[1.5px]'}`} />
                                        {item.badge > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none shadow">
                                                {item.badge > 9 ? '9+' : item.badge}
                                            </span>
                                        )}
                                    </span>
                                    <span className="whitespace-nowrap hidden lg:inline">{item.label}</span>
                                    {isActive && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-600 rounded-t-full"></span>}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

                    <button
                        onClick={() => navigate('/recruiter/notifications')}
                        className="relative text-gray-500 hover:text-gray-800 transition"
                        title="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        {notifCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 shadow">
                                {notifCount > 9 ? '9+' : notifCount}
                            </span>
                        )}
                    </button>

                    <div className="relative group">
                        <button className="flex items-center gap-2 outline-none">
                            <UserAvatar size={8} className="ring-2 ring-white shadow-sm" />
                        </button>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all transform origin-top-right z-50">
                            <div className="px-4 py-2 border-b border-gray-50">
                                <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                            <Link to="/recruiter/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <User className="w-4 h-4" /> Profile
                            </Link>
                            <Link to="/recruiter/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Grid className="w-4 h-4" /> Settings
                            </Link>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden text-gray-600 ml-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* MOBILE DROPDOWN NAV (Visible only on mobile when open) */}
            {sidebarOpen && (
                <div className="md:hidden bg-white border-b border-gray-200 p-4 space-y-2 relative z-40 shadow-xl">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                ${location.pathname.startsWith(item.path)
                                    ? 'bg-teal-50 text-teal-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }
                            `}
                        >
                            <span className="relative">
                                <item.icon className="w-5 h-5" />
                                {item.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none shadow">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </span>
                            {item.label}
                            {item.badge > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                                    {item.badge > 9 ? '9+' : item.badge}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            )}

            {/* MAIN CONTENT WRAPPER */}
            <main className="flex-1 p-4 md:p-6 w-full">
                {/* Back Button - Visible on all pages except Dashboard */}
                {location.pathname !== '/recruiter/dashboard' && (
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-6 flex items-center text-gray-500 hover:text-teal-600 transition-colors font-medium text-sm group"
                    >
                        <div className="p-1 rounded-full bg-gray-100 group-hover:bg-teal-100 mr-2 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Back
                    </button>
                )}
                <Outlet />
            </main>
        </div>
    );
};

const RecruiterLayout = () => (
    <ChatNotificationProvider>
        <RecruiterLayoutInner />
    </ChatNotificationProvider>
);

export default RecruiterLayout;
