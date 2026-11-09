import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, Building, MapPin, CheckCircle, Clock, XCircle, ChevronRight, Briefcase, AlertCircle, MessageCircle } from 'lucide-react';

const MyApplications = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const token = user.token;

                if (!token) {
                    setLoading(false);
                    return;
                }

                const res = await axios.get('http://localhost:5000/api/applications/my-applications', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                // Filter out Competitions and Mentorships for this view
                const jobApplications = res.data.filter(app =>
                    app.jobType !== 'Competition' && app.jobType !== 'Mentorship'
                );

                setApplications(jobApplications);
            } catch (err) {
                console.error('Error fetching applications:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Hired': return { color: 'green', icon: CheckCircle, label: 'Hired', step: 4 };
            case 'Interview': return { color: 'orange', icon: Clock, label: 'Interview', step: 3 };
            case 'Screening': return { color: 'purple', icon: Clock, label: 'Screening', step: 2 };
            case 'Applied': return { color: 'blue', icon: Clock, label: 'Applied', step: 1 };
            case 'Rejected': return { color: 'red', icon: XCircle, label: 'Rejected', step: 0 };
            default: return { color: 'gray', icon: Clock, label: status, step: 1 };
        }
    };

    // Helper to generate initials for logo placeholder
    const getInitials = (name) => {
        return name ? name.substring(0, 2).toUpperCase() : 'CO';
    };

    return (
        <div className="w-full py-4">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Applications</h1>
                <p className="text-gray-500 mt-2 text-lg">Track and manage your diverse career opportunities.</p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-500">Loading your applications...</p>
                </div>
            ) : applications.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Briefcase className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No applications yet</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">You haven't applied to any jobs yet. Start exploring thousands of opportunities that match your skills.</p>
                    <a href="/seeker/jobs" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                        Explore Jobs
                    </a>
                </div>
            ) : (
                <div className="space-y-6">
                    {applications.map((app) => {
                        const statusConfig = getStatusConfig(app.status);
                        const isRejected = app.status === 'Rejected';

                        return (
                            <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
                                        {/* Company Info */}
                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 flex items-center justify-center text-xl font-bold shadow-sm border border-blue-100 shrink-0">
                                                {getInitials(app.companyName)}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 leading-tight">{app.jobTitle}</h3>
                                                <div className="flex items-center gap-2 text-gray-600 font-medium mt-1">
                                                    <Building className="w-4 h-4" /> {app.companyName}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mt-3">
                                                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {app.jobLocation}</span>
                                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex flex-col items-end gap-2">
                                            <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border ${isRejected
                                                ? 'bg-red-50 text-red-700 border-red-100'
                                                : 'bg-green-50 text-green-700 border-green-100'
                                                }`}>
                                                <statusConfig.icon className="w-4 h-4" />
                                                {statusConfig.label}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Timeline */}
                                    <div className="mt-8 mb-2 relative">
                                        {isRejected ? (
                                            <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-semibold text-red-800">Application Update</h4>
                                                    <p className="text-sm text-red-700 mt-1">
                                                        Thank you for your interest. Unfortunately, the recruiter has decided not to move forward with your application at this time.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                                                    <div style={{ width: `${(statusConfig.step / 4) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"></div>
                                                </div>
                                                <div className="flex justify-between text-xs sm:text-sm font-medium text-gray-500">
                                                    <span className={statusConfig.step >= 1 ? 'text-blue-600 font-bold' : ''}>Applied</span>
                                                    <span className={statusConfig.step >= 2 ? 'text-blue-600 font-bold' : ''}>Screening</span>
                                                    <span className={statusConfig.step >= 3 ? 'text-blue-600 font-bold' : ''}>Interview</span>
                                                    <span className={statusConfig.step >= 4 ? 'text-green-600 font-bold' : ''}>Hired</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Footer: AI Feedback + Message button */}
                                <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center gap-3">
                                    <button
                                        onClick={() => navigate(`/seeker/messages?recruiterId=${app.recruiterId}&name=${encodeURIComponent(app.recruiterName || app.companyName || 'Recruiter')}&jobTitle=${encodeURIComponent(app.jobTitle || '')}`)}
                                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-white hover:bg-blue-600 font-semibold px-4 py-2 rounded-lg border border-blue-200 hover:border-blue-600 transition-all shrink-0"
                                    >
                                        <MessageCircle className="w-4 h-4" /> Message Recruiter
                                    </button>

                                    {app.aiFeedback && (
                                        <div className="flex gap-3 flex-1 min-w-0">
                                            <div className="mt-1 bg-white p-1.5 rounded-md shadow-sm border border-gray-200 shrink-0 h-fit">
                                                <span className="text-lg">🤖</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-800 mb-1">AI Resume Analysis</p>
                                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{app.aiFeedback}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyApplications;
