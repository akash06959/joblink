import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Briefcase, FileText, Users, Clock,
    ArrowUpRight, Plus, MoreHorizontal,
    Calendar, CheckCircle, BarChart3, ChevronRight
} from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalJobs: 0,
        totalApplications: 0,
        recentApplications: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user.token) return;

            try {
                const res = await axios.get('http://localhost:5000/api/jobs/stats', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setStats(res.data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const firstName = user.name?.split(' ')[0] || 'Recruiter';

    // Derived metrics for UI
    const pendingReviews = stats.recentApplications.filter(a => a.status === 'Applied').length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
                <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Loading workspace...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in font-sans">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back, {firstName}</h1>
                    <p className="text-gray-500 mt-2 font-medium">Here's what's happening in your hiring pipeline today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
                        onClick={() => navigate('/recruiter/my-jobs')}
                    >
                        <Briefcase className="w-4 h-4" />
                        Manage Jobs
                    </button>
                    <button
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-semibold text-sm transition-all shadow-md flex items-center gap-2"
                        onClick={() => navigate('/recruiter/post-job')}
                    >
                        <Plus className="w-4 h-4" />
                        Create Posting
                    </button>
                </div>
            </div>

            {/* Top KPI Cards (Sleek SaaS Style) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Card 1 */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-gray-500 font-semibold text-sm">Active Jobs</div>
                        <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-colors">
                            <Briefcase className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-end gap-3">
                        <div className="text-3xl font-bold text-gray-900">{stats.totalJobs}</div>
                        <div className="flex items-center text-green-600 text-sm font-bold pb-1 bg-green-50 px-2 rounded">
                            <ArrowUpRight className="w-3 h-3 mr-0.5" /> 12%
                        </div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-gray-500 font-semibold text-sm">Total Applications</div>
                        <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-colors">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-end gap-3">
                        <div className="text-3xl font-bold text-gray-900">{stats.totalApplications}</div>
                        <div className="flex items-center text-green-600 text-sm font-bold pb-1 bg-green-50 px-2 rounded">
                            <ArrowUpRight className="w-3 h-3 mr-0.5" /> 8%
                        </div>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-gray-500 font-semibold text-sm">Pending Reviews</div>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-end gap-3">
                        <div className="text-3xl font-bold text-gray-900">{pendingReviews}</div>
                        <div className="text-gray-400 text-sm font-medium pb-1">Needs action</div>
                    </div>
                </div>

                {/* Card 4 - Pipeline Conversion */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-gray-500 font-semibold text-sm">Interview Rate</div>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-end gap-3">
                        <div className="text-3xl font-bold text-gray-900">
                            {stats.totalApplications > 0 ? Math.round((stats.recentApplications.filter(a => a.status === 'Interview').length / stats.totalApplications) * 100) : 0}%
                        </div>
                        <div className="flex items-center text-gray-500 text-sm font-medium pb-1">
                            Avg. Conversion
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Applications (Data Table Style) */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h2 className="text-lg font-bold text-gray-900">Recent Applications</h2>
                        <Link to="/recruiter/my-jobs" className="text-sm font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                            View all <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        {stats.recentApplications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <FileText className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">No applications yet</h3>
                                <p className="text-gray-500 text-sm max-w-xs">When candidates apply to your jobs, they'll appear here.</p>
                                <button
                                    onClick={() => navigate('/recruiter/post-job')}
                                    className="mt-6 px-4 py-2 bg-teal-50 text-teal-600 font-semibold rounded-lg hover:bg-teal-100 transition-colors"
                                >
                                    Post a Job
                                </button>
                            </div>
                        ) : (
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Candidate</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Applied</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {stats.recentApplications.slice(0, 5).map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-100 to-teal-50 flex items-center justify-center text-teal-700 font-bold text-sm border border-teal-100/50">
                                                        {app.applicantName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm group-hover:text-teal-600 transition-colors">{app.applicantName}</p>
                                                        <p className="text-xs text-gray-500">{app.applicantEmail || 'candidate@email.com'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-800 text-sm truncate max-w-[150px]">{app.jobTitle}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${app.status === 'Applied' ? 'bg-teal-50 text-teal-700 border-teal-200/60' :
                                                        app.status === 'Interview' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                                                            app.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                                                                'bg-red-50 text-red-700 border-red-200/60'
                                                    }`}>
                                                    {app.status === 'Applied' && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5"></span>}
                                                    {app.status === 'Interview' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>}
                                                    {app.status === 'Accepted' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>}
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                                {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right Column: Mini Widgets */}
                <div className="space-y-6">
                    {/* Hiring Pipeline Summary */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-bold text-gray-900 mb-5">Hiring Pipeline</h3>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-gray-700">Sourced / Applied</span>
                                    <span className="text-gray-500 font-semibold">{stats.recentApplications.filter(a => a.status === 'Applied').length}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-teal-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-gray-700">Interviewing</span>
                                    <span className="text-gray-500 font-semibold">{stats.recentApplications.filter(a => a.status === 'Interview').length}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-gray-700">Hired</span>
                                    <span className="text-gray-500 font-semibold">{stats.recentApplications.filter(a => a.status === 'Accepted').length}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Tasks */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-white">
                            <h3 className="text-base font-bold text-gray-900">Upcoming Schedule</h3>
                        </div>
                        <div className="p-2">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                                    <div className="mr-4 flex flex-col items-center justify-center min-w-[2.5rem]">
                                        <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Feb</span>
                                        <span className="text-lg font-black text-gray-800 tracking-tight">{10 + i}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-teal-600 transition-colors">Technical Interview</h4>
                                        <div className="flex items-center text-xs text-gray-500 mt-1 font-medium">
                                            <Calendar className="w-3 h-3 mr-1" /> 10:00 AM - 11:00 AM
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                            <button className="w-full text-center text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                                View full calendar
                            </button>
                        </div>
                    </div>

                    {/* Modern Premium Upgrade Promo */}
                    <div className="bg-gray-900 rounded-xl p-6 text-white relative overflow-hidden shadow-lg border border-gray-800">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-teal-300">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-bold text-sm tracking-wide uppercase">JobLink Pro</span>
                            </div>
                            <h4 className="text-lg font-bold mb-2">Automate your screening.</h4>
                            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                                Use our AI Agent to auto-screen candidates and schedule interviews instantly.
                            </p>
                            <button className="w-full py-2.5 bg-white text-gray-900 font-bold rounded-lg text-sm transition hover:bg-gray-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                Upgrade Workspace
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
