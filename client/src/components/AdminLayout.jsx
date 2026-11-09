import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, LogOut, ChevronRight, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState({});

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname.includes(path);
    };

    const navItems = [
        { path: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { path: 'users', name: 'Users', icon: Users },
        { path: 'jobs', name: 'Jobs', icon: Briefcase },
    ];

    return (
        <div className="flex min-h-screen bg-[#f8fafc] font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* High-End Dark Sidebar */}
            <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-[#0f172a] text-slate-300 shadow-2xl transition-all duration-300">
                <div className="flex h-full flex-col px-4 py-6">
                    {/* Brand/Logo Area */}
                    <div className="mb-10 flex items-center px-2">
                        <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                            <span className="text-xl font-extrabold tracking-wider">A</span>
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">
                            Admin<span className="text-indigo-400">Panel</span>
                        </span>
                    </div>

                    {/* Navigation */}
                    <ul className="space-y-2 flex-1">
                        {navItems.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={`/admin/${item.path}`}
                                        className={`group relative flex items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-300 ${active
                                                ? 'bg-indigo-500/10 text-indigo-400'
                                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <item.icon size={22} className={`mr-4 transition-transform duration-300 ${active ? 'scale-110 text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                            <span className={`font-medium ${active ? 'text-white' : ''}`}>{item.name}</span>
                                        </div>
                                        {active && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute left-0 h-full w-1 rounded-r-lg bg-indigo-500"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        {active && <ChevronRight size={18} className="text-indigo-400 opacity-70" />}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    {/* User Profile & Logout Bottom Area */}
                    <div className="mt-auto pt-6 border-t border-slate-700/50">
                        <div className="mb-4 flex items-center gap-4 rounded-2xl bg-slate-800/40 p-3.5 border border-slate-700/50 backdrop-blur-sm">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-md">
                                {user.name?.charAt(0) || 'A'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="truncate text-sm font-semibold text-white">
                                    {user.name || 'Admin User'}
                                </p>
                                <p className="truncate text-xs text-slate-400">
                                    {user.email || 'admin@joblink.com'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="group flex w-full items-center justify-center rounded-xl bg-slate-800/30 p-3 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-red-500/10 hover:text-red-400 hover:shadow-inner"
                        >
                            <LogOut size={20} className="mr-2 transition-transform group-hover:-translate-x-1" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="ml-72 w-full flex flex-col">
                <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-10 backdrop-blur-md">
                    <h2 className="text-xl font-semibold text-slate-800 capitalize">
                        {location.pathname.split('/').pop().replace('-', ' ')}
                    </h2>
                    <div className="flex items-center gap-6">
                        <button className="relative rounded-full bg-slate-100 p-2.5 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600">
                            <Bell size={20} />
                            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
                        </button>
                    </div>
                </header>
                <main className="flex-1 p-10 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
