import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, DollarSign, Calendar, Briefcase } from 'lucide-react';

const MyJobs = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user.token;

            if (!token) return;

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            try {
                const response = await axios.get('http://localhost:5000/api/jobs/my-jobs', config);
                setJobs(response.data);
            } catch (error) {
                console.error('Error fetching jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    if (loading) {
        return <div className="text-center">Loading jobs...</div>;
    }

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-16 text-center shadow-sm">
                <div className="mb-4 rounded-full bg-gray-100 p-4">
                    <Briefcase size={48} className="text-gray-400" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-800">No Jobs Posted Yet</h3>
                <p className="max-w-md text-gray-500">
                    Create your first job posting to start finding candidates.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Opportunities</h1>
                    <p className="text-gray-500">Manage your active listings and track applications.</p>
                </div>
                <div className="bg-teal-50 text-teal-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                    {jobs.length} Active Listings
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job) => (
                    <div
                        key={job._id}
                        className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-teal-200 hover:shadow-xl hover:-translate-y-1"
                    >
                        <div>
                            <div className="mb-4 flex items-start justify-between">
                                <div className="p-3 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl text-teal-600 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                                    <Briefcase size={24} />
                                </div>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-bold border ${job.status === 'Active'
                                        ? 'bg-green-50 text-green-600 border-green-100'
                                        : 'bg-gray-50 text-gray-600 border-gray-100'
                                        }`}
                                >
                                    {job.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors mb-1 line-clamp-1">
                                {job.title}
                            </h3>
                            <p className="text-sm font-medium text-gray-500 mb-4">{job.company}</p>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                    <MapPin size={16} className="mr-2 text-gray-400" />
                                    <span className="truncate">{job.location}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg flex-1">
                                        <Briefcase size={16} className="mr-2 text-gray-400" />
                                        <span className="truncate">{job.type}</span>
                                    </div>
                                    {job.salary && (
                                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg flex-1">
                                            <DollarSign size={16} className="mr-2 text-gray-400" />
                                            <span className="truncate">{job.salary}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="border-t border-gray-100 pt-4 mb-4">
                                <div className="flex flex-wrap gap-2">
                                    {job.requirements.slice(0, 3).map((req, index) => (
                                        <span
                                            key={index}
                                            className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-100"
                                        >
                                            {req}
                                        </span>
                                    ))}
                                    {job.requirements.length > 3 && (
                                        <span className="text-xs text-gray-400 flex items-center">+{job.requirements.length - 3}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => navigate(`/recruiter/edit-job/${job.id}`)}
                                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => navigate(`/recruiter/job/${job.id}/applications`)}
                                    className="flex-[2] rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-200 transition shadow-md"
                                >
                                    View Applications
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyJobs;
