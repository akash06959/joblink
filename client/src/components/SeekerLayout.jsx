import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Search, Bell, User, LogOut, Grid, Award, Layers, Menu, ArrowLeft, Link2, MessageCircle, FileText, Calendar } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ChatNotificationProvider, useChatNotifications } from './ChatNotificationContext';
import UserAvatar from './UserAvatar';

/* Inner layout — can access the notification context */
const SeekerLayoutInner = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { totalUnread, clearUnread } = useChatNotifications();
    const [notifCount, setNotifCount] = useState(0);

    /* Fetch unread notification count from API */
    const fetchNotifCount = useCallback(async () => {
        const me = JSON.parse(localStorage.getItem('user') || '{}');
        if (!me.token) return;
        try {
            const { data } = await axios.get('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${me.token}` }
            });
            setNotifCount(data.filter(n => !n.read).length);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        fetchNotifCount();
        const interval = setInterval(fetchNotifCount, 30000);  // refresh every 30s
        return () => clearInterval(interval);
    }, [fetchNotifCount]);

    /* Clear message badge when on messages page */
    useEffect(() => {
        if (location.pathname === '/seeker/messages') clearUnread();
        /* Clear notification badge when on notifications page */
        if (location.pathname === '/seeker/notifications') setNotifCount(0);
    }, [location.pathname, clearUnread]);

    const navItems = [
        { icon: Home, label: 'Home', path: '/seeker/home' },
        { icon: Briefcase, label: 'Jobs', path: '/seeker/jobs' },
        { icon: Award, label: 'Competitions', path: '/seeker/competitions' },
        { icon: Layers, label: 'Mentorship', path: '/seeker/mentorship' },
        { icon: MessageCircle, label: 'Messages', path: '/seeker/messages', badge: totalUnread },
        { icon: FileText, label: 'Smart Match', path: '/seeker/resume-analyzer' },
        { icon: Search, label: 'Applications', path: '/seeker/my-applications' },
        { icon: Calendar, label: 'My Events', path: '/seeker/registered-events' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
            {/* TRADITIONAL TOP NAVBAR */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 px-4 md:px-8 h-16 flex items-center justify-between shadow-sm">

                {/* LEFT: Logo */}
                <div className="flex items-center gap-2">
                    <Link to="/seeker/home" className="flex items-center gap-2 group">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                            <Link2 className="w-6 h-6 -rotate-45" />
                        </div>
                        <span className="font-bold text-2xl text-gray-800 tracking-tight hidden sm:block">
                            Job<span className="text-blue-600">Link</span>
                        </span>
                    </Link>
                </div>

                {/* CENTER: Search Bar */}
                <div className="flex-1 max-w-2xl px-8 hidden lg:block">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search Opportunities"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    navigate(`/seeker/jobs?search=${encodeURIComponent(e.target.value)}`);
                                }
                            }}
                            className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-700"
                        />
                    </div>
                </div>

                {/* RIGHT: Nav Links & Actions */}
                <div className="flex items-center gap-2 md:gap-6">

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-4 lg:gap-6 mr-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path || (item.path !== '/seeker/home' && location.pathname.startsWith(item.path));

                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors relative py-5
                                        ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}
                                    `}
                                >
                                    {/* Icon + badge wrapper */}
                                    <span className="relative">
                                        <Icon className={`w-4 h-4 ${isActive ? 'stroke-2' : 'stroke-[1.5px]'}`} />
                                        {item.badge > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none shadow">
                                                {item.badge > 9 ? '9+' : item.badge}
                                            </span>
                                        )}
                                    </span>
                                    <span className="whitespace-nowrap hidden lg:inline">{item.label}</span>
                                    {isActive && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Mobile Search Icon */}
                    <button className="lg:hidden text-gray-500 hover:text-gray-700">
                        <Search className="w-5 h-5" />
                    </button>

                    <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

                    <button
                        onClick={() => navigate('/seeker/notifications')}
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
                            <UserAvatar size={8} />
                        </button>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all transform origin-top-right z-50">
                            <Link to="/seeker/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <User className="w-4 h-4" /> Profile
                            </Link>
                            <Link to="/seeker/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
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

            {/* MOBILE DROPDOWN NAV */}
            {sidebarOpen && (
                <div className="md:hidden bg-white border-b border-gray-200 p-4 space-y-2 relative z-40 shadow-xl">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                ${location.pathname.startsWith(item.path)
                                    ? 'bg-blue-50 text-blue-600'
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

            {/* MAIN CONTENT */}
            <main className="flex-1 p-4 md:p-6 w-full">
                {location.pathname !== '/seeker/home' && (
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-6 flex items-center text-gray-500 hover:text-blue-600 transition-colors font-medium text-sm group"
                    >
                        <div className="p-1 rounded-full bg-gray-100 group-hover:bg-blue-100 mr-2 transition-colors">
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

const SeekerLayout = () => (
    <ChatNotificationProvider>
        <SeekerLayoutInner />
    </ChatNotificationProvider>
);

export default SeekerLayout;
