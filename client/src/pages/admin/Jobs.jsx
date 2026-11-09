import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Search, Briefcase, MoreVertical, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredUsers(jobs);
        } else {
            const filtered = jobs.filter(job =>
                job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.company.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, jobs]);

    const fetchJobs = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/admin/jobs', config);
            setJobs(data);
            setFilteredUsers(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch jobs');
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`http://localhost:5000/api/admin/jobs/${id}`, config);

            setJobs(jobs.filter(j => j._id !== id && j.id !== id));
            toast.success('Job deleted successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete job');
        }
    };

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
    );

    return (
        <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Jobs Management</h1>
                    <p className="mt-1 text-slate-500">Monitor and manage all job postings across the platform.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            className="w-72 bg-white pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 outline outline-1 outline-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-4 font-semibold">Job Title</th>
                                <th className="px-8 py-4 font-semibold">Company / Recruiter</th>
                                <th className="px-8 py-4 font-semibold">Posted Date</th>
                                <th className="px-8 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                            <AnimatePresence>
                                {filteredJobs.length > 0 ? (
                                    filteredJobs.map((job) => (
                                        <motion.tr
                                            key={job.id || job._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="bg-white hover:bg-slate-50/80 transition-colors group"
                                        >
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shadow-sm">
                                                        <Briefcase size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{job.title}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-xs overflow-hidden text-ellipsis">
                                                            ID: {job.id || job._id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="font-medium text-slate-800">{job.company}</div>
                                                <div className="text-xs text-slate-500">{job.recruiter?.name || 'Unknown Recruiter'}</div>
                                            </td>
                                            <td className="px-8 py-4 text-slate-500">
                                                {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Details">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(job.id || job._id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Job"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Search size={32} className="text-slate-300" />
                                                <p>No jobs found matching your search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminJobs;
