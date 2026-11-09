import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, Building, MapPin, CheckCircle, Clock, XCircle, ChevronRight, Briefcase, AlertCircle, MessageCircle, Award, Layers } from 'lucide-react';

const RegisteredEvents = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
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

                // Filter specifically for Competitions and Mentorships
                const userEvents = res.data.filter(app =>
                    app.jobType === 'Competition' || app.jobType === 'Mentorship'
                );

                setEvents(userEvents);
            } catch (err) {
                console.error('Error fetching registered events:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Hired': return { color: 'green', icon: CheckCircle, label: 'Accepted', step: 4 };
            case 'Interview': return { color: 'orange', icon: Clock, label: 'In Review', step: 3 };
            case 'Screening': return { color: 'purple', icon: Clock, label: 'Screening', step: 2 };
            case 'Applied': return { color: 'blue', icon: Clock, label: 'Registered', step: 1 };
            case 'Rejected': return { color: 'red', icon: XCircle, label: 'Declined', step: 0 };
            default: return { color: 'gray', icon: Clock, label: status, step: 1 };
        }
    };

    const getInitials = (name) => {
        return name ? name.substring(0, 2).toUpperCase() : 'CO';
    };

    return (
        <div className="w-full py-4">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Registered Events</h1>
                <p className="text-gray-500 mt-2 text-lg">Manage your hackathons, competitions, and mentorship sessions.</p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-500">Loading your events...</p>
                </div>
            ) : events.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Award className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No events registered</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">You haven't signed up for any competitions or mentorships yet.</p>
                    <div className="flex justify-center gap-4">
                        <a href="/seeker/competitions" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg hover:shadow-xl">
                            Browse Competitions
                        </a>
                        <a href="/seeker/mentorship" className="inline-flex items-center justify-center px-6 py-3 border border-indigo-200 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition shadow-sm">
                            Find Mentors
                        </a>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {events.map((app) => {
                        const statusConfig = getStatusConfig(app.status);
                        const isRejected = app.status === 'Rejected';
                        const isMentorship = app.jobType === 'Mentorship';

                        return (
                            <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
                                        <div className="flex gap-4">
                                            <div className={`w-16 h-16 rounded-xl text-xl font-bold flex items-center justify-center shadow-sm border shrink-0 ${isMentorship ? 'bg-gradient-to-br from-pink-50 to-rose-50 text-pink-700 border-pink-100' : 'bg-gradient-to-br from-indigo-50 to-orange-50 text-indigo-700 border-indigo-100'}`}>
                                                {getInitials(app.companyName)}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                                                    {app.jobTitle}
                                                    <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isMentorship ? 'bg-pink-100 text-pink-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                                        {isMentorship ? <Layers className="w-3 h-3 mr-1" /> : <Award className="w-3 h-3 mr-1" />}
                                                        {app.jobType}
                                                    </span>
                                                </h3>
                                                <div className="flex items-center gap-2 text-gray-600 font-medium mt-1">
                                                    <Building className="w-4 h-4" /> {app.companyName}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mt-3">
                                                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {app.jobLocation}</span>
                                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Registered on {new Date(app.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border ${isRejected
                                                ? 'bg-red-50 text-red-700 border-red-100'
                                                : 'bg-green-50 text- зеле-700 border-green-100 text-green-700'
                                                }`}>
                                                <statusConfig.icon className="w-4 h-4" />
                                                {statusConfig.label}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Timeline for events */}
                                    <div className="mt-8 mb-2 relative">
                                        {isRejected ? (
                                            <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-semibold text-red-800">Status Update</h4>
                                                    <p className="text-sm text-red-700 mt-1">
                                                        Unfortunately, your registration was not accepted for this event.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                                                    <div style={{ width: `${(statusConfig.step / 4) * 100}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${isMentorship ? 'bg-pink-500' : 'bg-indigo-500'}`}></div>
                                                </div>
                                                <div className="flex justify-between text-xs sm:text-sm font-medium text-gray-500">
                                                    <span className={statusConfig.step >= 1 ? (isMentorship ? 'text-pink-600 font-bold' : 'text-indigo-600 font-bold') : ''}>Registered</span>
                                                    <span className={statusConfig.step >= 2 ? (isMentorship ? 'text-pink-600 font-bold' : 'text-indigo-600 font-bold') : ''}>Screening</span>
                                                    <span className={statusConfig.step >= 3 ? (isMentorship ? 'text-pink-600 font-bold' : 'text-indigo-600 font-bold') : ''}>In Review</span>
                                                    <span className={statusConfig.step >= 4 ? 'text-green-600 font-bold' : ''}>Accepted</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center gap-3">
                                    <button
                                        onClick={() => navigate(`/seeker/messages?recruiterId=${app.recruiterId}&name=${encodeURIComponent(app.recruiterName || app.companyName || 'Host')}&jobTitle=${encodeURIComponent(app.jobTitle || '')}`)}
                                        className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-white hover:bg-indigo-600 font-semibold px-4 py-2 rounded-lg border border-indigo-200 hover:border-indigo-600 transition-all shrink-0"
                                    >
                                        <MessageCircle className="w-4 h-4" /> Message Organizer
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RegisteredEvents;
