import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Briefcase, FileText, CheckCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                const { data } = await axios.get('http://localhost:5000/api/admin/stats', config);
                setStats(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleGenerateReport = () => {
        if (!stats) return;

        try {
            const { counts, recentUsers } = stats;
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "--- JobLink Platform Report ---\n\n";

            // Overall Statistics
            csvContent += "OVERALL STATISTICS\n";
            csvContent += `Total Users,${counts.totalUsers}\n`;
            csvContent += `Total Jobs,${counts.totalJobs}\n`;
            csvContent += `Active Jobs,${counts.activeJobs}\n`;
            csvContent += `Total Applications,${counts.totalApplications}\n`;
            csvContent += "\n";

            // Recent Users
            csvContent += "RECENT USERS\n";
            csvContent += "Name,Email,Role,Joined Date\n";

            recentUsers.forEach(user => {
                const date = new Date(user.createdAt).toLocaleDateString('en-US');
                const name = `"${user.name.replace(/"/g, '""')}"`;
                const email = `"${user.email}"`;
                const role = `"${user.role}"`;
                csvContent += `${name},${email},${role},${date}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `JobLink_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Report downloaded successfully!");
        } catch (error) {
            console.error("Error generating report:", error);
            toast.error("Failed to generate report.");
        }
    };

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
    );

    if (!stats) return <div className="text-red-500 bg-red-50 p-4 rounded-xl">Failed to load stats. Please check your connection.</div>;

    const { counts, recentUsers } = stats;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
                    <p className="mt-1 text-slate-500">Welcome back, here is what is happening today.</p>
                </div>
                <button
                    onClick={handleGenerateReport}
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                    <TrendingUp size={16} className="text-indigo-500" />
                    <span>Generate Report</span>
                </button>
            </motion.div>

            {/* Stats Cards */}
            <motion.div variants={itemVariants} className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={counts.totalUsers}
                    icon={<Users className="text-white" size={24} />}
                    gradient="from-blue-500 to-indigo-600"
                    trend="+12% this month"
                />
                <StatCard
                    title="Total Jobs"
                    value={counts.totalJobs}
                    icon={<Briefcase className="text-white" size={24} />}
                    gradient="from-purple-500 to-pink-600"
                    trend="+5% this month"
                />
                <StatCard
                    title="Active Jobs"
                    value={counts.activeJobs}
                    icon={<CheckCircle className="text-white" size={24} />}
                    gradient="from-emerald-400 to-teal-500"
                    trend="+18% this month"
                />
                <StatCard
                    title="Applications"
                    value={counts.totalApplications}
                    icon={<FileText className="text-white" size={24} />}
                    gradient="from-orange-400 to-amber-500"
                    trend="+24% this month"
                />
            </motion.div>

            {/* Recent Users Table */}
            <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 outline outline-1 outline-white overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-slate-800">Recent Users</h3>
                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-8 py-4 font-semibold">User Details</th>
                                <th className="px-8 py-4 font-semibold">Role</th>
                                <th className="px-8 py-4 font-semibold">Joined Date</th>
                                <th className="px-8 py-4 font-semibold text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                            {recentUsers.map((user) => (
                                <tr key={user.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900">{user.name}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === 'Recruiter' ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-600/20' :
                                            user.role === 'Admin' ? 'bg-red-100 text-red-700 ring-1 ring-red-600/20' :
                                                'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-slate-500">
                                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/20">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                            Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
};

const StatCard = ({ title, value, icon, gradient, trend }) => (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/40 ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/50">
        <div className="relative z-10 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            </div>
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg shadow-indigo-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                {icon}
            </div>
        </div>
        <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
            <TrendingUp size={14} className="mr-1" />
            {trend}
        </div>
        <div className={`absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-[0.03] transition-transform duration-500 group-hover:scale-150`}></div>
    </div>
);

export default AdminDashboard;
