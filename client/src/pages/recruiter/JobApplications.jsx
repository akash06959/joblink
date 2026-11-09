import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, User, FileText, Download, Mail, Star, X, Users, MessageCircle, Info, Sparkles, MapPin, Briefcase } from 'lucide-react';

const JobApplications = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedResume, setSelectedResume] = useState(null); // For Modal
    const [selectedFeedback, setSelectedFeedback] = useState(null); // For AI Overview Modal
    const [selectedProfile, setSelectedProfile] = useState(null); // For Applicant Profile Modal

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const token = user.token;

                if (!token) {
                    navigate('/login');
                    return;
                }

                const res = await axios.get(`http://localhost:5000/api/applications/job/${jobId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setApplications(res.data);
            } catch (err) {
                console.error('Error fetching applications:', err);
                setError('Failed to load applications. You may not be authorized.');
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [jobId, navigate]);

    const handleViewResume = (path) => {
        // We use the new backend endpoint that forces inline PDF headers
        // Path is typically "uploads\\resumes\\filename"
        // We need to extract just the filename
        const filename = path.split(/[\\/]/).pop();
        const url = `http://localhost:5000/api/applications/resume/${filename}`;

        setSelectedResume(url);
    };

    const handleStatusUpdate = async (appId, newStatus) => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            await axios.put(`http://localhost:5000/api/applications/${appId}/status`,
                { status: newStatus },
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );

            // Update local state immediately for instant UI feedback
            setApplications(prev => prev.map(app =>
                app.id === appId ? { ...app, status: newStatus } : app
            ));
            toast.success('Application status updated.');
        } catch (err) {
            console.error('Failed to update status', err);
            toast.error('Failed to update status. Please try again.');
        }
    };

    return (
        <div className="w-full animate-fade-in relative">
            {/* Resume Modal */}
            {selectedResume && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full h-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-teal-600" /> Resume Preview
                            </h3>
                            <div className="flex gap-2">
                                <a
                                    href={selectedResume}
                                    download
                                    className="p-2 hover:bg-gray-200 rounded-lg text-gray-600 transition"
                                    title="Download"
                                >
                                    <Download className="w-5 h-5" />
                                </a>
                                <button
                                    onClick={() => setSelectedResume(null)}
                                    className="p-2 hover:bg-red-100 hover:text-red-500 rounded-lg text-gray-500 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-100 relative">
                            <iframe
                                src={selectedResume}
                                className="w-full h-full border-0"
                                title="Resume Viewer"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* AI Feedback Modal */}
            {selectedFeedback && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                                <Sparkles className="w-5 h-5 text-teal-600" /> Detailed AI Analysis
                            </h3>
                            <button
                                onClick={() => setSelectedFeedback(null)}
                                className="p-2 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-white flex-1">
                            <div className="mb-6 flex justify-between items-start">
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900">{selectedFeedback.applicantName}</h4>
                                    <p className="text-gray-500 text-sm">AI Match Score: <span className="font-bold text-gray-800">{selectedFeedback.aiScore}%</span></p>
                                </div>
                                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed bg-gray-50 border border-gray-100 rounded-xl p-5">
                                {selectedFeedback.aiFeedback || 'No detailed overview available for this candidate.'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Applicant Profile Modal */}
            {selectedProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative">
                        {/* Fixed Close Button */}
                        <button
                            onClick={() => setSelectedProfile(null)}
                            className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Scrollable Area */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Header Image */}
                            <div className="relative h-32 bg-gradient-to-r from-teal-500 to-emerald-600 flex-shrink-0">
                            </div>

                            {/* Profile Content */}
                            <div className="px-8 pb-8 relative z-10">
                                {/* Avatar / Name */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 mb-6">
                                    <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden shrink-0">
                                        {selectedProfile.applicantAvatar ? (
                                            <img src={`http://localhost:5000/${selectedProfile.applicantAvatar.replace(/^[\/\\]+/, '')}`} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center text-teal-600 text-5xl font-bold">
                                                {selectedProfile.applicantName?.charAt(0) || 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center sm:text-left pb-2">
                                        <h2 className="text-3xl font-bold text-gray-900">{selectedProfile.applicantName || 'Unknown User'}</h2>
                                        <p className="text-gray-500 font-medium">{selectedProfile.applicantHeadline || 'No Headline Provided'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Left Column: Info */}
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Contact Info</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                                    <Mail className="w-4 h-4 text-teal-500 shrink-0" />
                                                    <span className="truncate" title={selectedProfile.applicantEmail}>{selectedProfile.applicantEmail}</span>
                                                </div>
                                                {selectedProfile.applicantLocation && (
                                                    <div className="flex items-center gap-3 text-sm text-gray-700">
                                                        <MapPin className="w-4 h-4 text-teal-500 shrink-0" />
                                                        <span>{selectedProfile.applicantLocation}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {selectedProfile.applicantEducation && (
                                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Education</h3>
                                                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                                    {selectedProfile.applicantEducation}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column: About & Skills */}
                                    <div className="md:col-span-2 space-y-6">
                                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                                            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3 relative z-10">
                                                <User className="w-4 h-4 text-teal-600" /> About
                                            </h3>
                                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap relative z-10">
                                                {selectedProfile.applicantAbout || 'This candidate hasn\'t written an about section yet.'}
                                            </p>
                                        </div>

                                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                                <Briefcase className="w-4 h-4 text-teal-600" /> Top Skills
                                            </h3>
                                            {selectedProfile.applicantSkills ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {(() => {
                                                        let skillsList = [];
                                                        if (Array.isArray(selectedProfile.applicantSkills)) {
                                                            skillsList = selectedProfile.applicantSkills;
                                                        } else if (typeof selectedProfile.applicantSkills === 'string') {
                                                            skillsList = selectedProfile.applicantSkills.split(',').map(s => s.trim()).filter(Boolean);
                                                        }
                                                        return skillsList.map((skill, index) => (
                                                            <span key={index} className="px-3 py-1.5 bg-gray-50 hover:bg-teal-50 border border-gray-100 hover:border-teal-200 text-gray-700 hover:text-teal-700 rounded-lg text-xs font-semibold tracking-wide transition-colors">
                                                                {skill}
                                                            </span>
                                                        ))
                                                    })()}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No skills listed.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Footer Actions */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 z-10 shrink-0">
                            <button
                                onClick={() => {
                                    setSelectedProfile(null);
                                    if (selectedProfile.resumePath) {
                                        handleViewResume(selectedProfile.resumePath);
                                    }
                                }}
                                disabled={!selectedProfile.resumePath || selectedProfile.resumePath === 'Not Required'}
                                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                                <FileText className="w-4 h-4" /> View Resume
                            </button>
                            <button
                                onClick={() => {
                                    const app = selectedProfile;
                                    setSelectedProfile(null);
                                    navigate(`/recruiter/messages?seekerId=${app.applicantId}&name=${encodeURIComponent(app.applicantName || 'Applicant')}&jobTitle=${encodeURIComponent(app.jobTitle || '')}`);
                                }}
                                className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-md shadow-teal-200 transition-all active:scale-95 flex items-center gap-2 text-sm"
                            >
                                <MessageCircle className="w-4 h-4" /> Reach Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate('/recruiter/my-jobs')}
                    className="flex items-center text-gray-500 hover:text-teal-600 transition font-medium text-sm group"
                >
                    <div className="p-1 rounded-full bg-gray-100 group-hover:bg-teal-100 mr-2 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    Back to My Opportunities
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Applications</h1>
                <p className="text-gray-500">Manage and screen candidates for this opportunity.</p>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400 animate-pulse">Loading candidates...</div>
            ) : error ? (
                <div className="text-center py-10 text-red-500 bg-red-50 rounded-xl">{error}</div>
            ) : applications.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Applicants Yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        Candidates will appear here once they apply. Try sharing your job post to attract more talent.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="p-5 font-bold text-gray-600 text-sm">Candidate</th>
                                    <th className="p-5 font-bold text-gray-600 text-sm">Status</th>
                                    <th className="p-5 font-bold text-gray-600 text-sm">AI Compatibility</th>
                                    <th className="p-5 font-bold text-gray-600 text-sm">Resume</th>
                                    <th className="p-5 font-bold text-gray-600 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {applications.map((app) => (
                                    <tr key={app.id} className="hover:bg-teal-50/30 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm">
                                                    {app.applicantName?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{app.applicantName || 'Unknown User'}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {app.applicantEmail}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="relative">
                                                <select
                                                    value={app.status === 'Shortlisted' ? 'Screening' : app.status}
                                                    onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                                                    className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer focus:ring-2 focus:ring-blue-100 transition-colors
                                                        ${app.status === 'Hired' ? 'bg-green-100 text-green-700' :
                                                            app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                                app.status === 'Interview' ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-teal-50 text-teal-700'}`}
                                                >
                                                    <option value="Applied">Applied</option>
                                                    <option value="Screening">Screening</option>
                                                    <option value="Interview">Interview</option>
                                                    <option value="Hired">Hired</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                {app.aiScore ? (
                                                    <>
                                                        <div className="flex flex-col gap-1 w-20">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-bold text-gray-800">{app.aiScore}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${app.aiScore > 75 ? 'bg-green-500' : app.aiScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                                    style={{ width: `${app.aiScore}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedFeedback(app)}
                                                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold border border-transparent hover:border-teal-100"
                                                            title="View detailed AI analysis"
                                                        >
                                                            <Info className="w-4 h-4" /> Details
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded">Not Analyzed</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => setSelectedProfile(app)}
                                                    className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold border border-transparent hover:border-indigo-100"
                                                >
                                                    <User className="w-4 h-4" /> User Profile
                                                </button>
                                                <button
                                                    onClick={() => handleViewResume(app.resumePath)}
                                                    disabled={!app.resumePath || app.resumePath === 'Not Required'}
                                                    className="w-full text-gray-600 hover:text-teal-600 hover:bg-teal-50 p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-transparent hover:border-teal-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <FileText className="w-4 h-4" /> View Resume
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`mailto:${app.applicantEmail}`}
                                                    className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    <Mail className="w-4 h-4" /> Email
                                                </a>
                                                <button
                                                    onClick={() => navigate(`/recruiter/messages?seekerId=${app.applicantId}&name=${encodeURIComponent(app.applicantName || 'Applicant')}&jobTitle=${encodeURIComponent(app.jobTitle || '')}`)}
                                                    className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-white hover:bg-teal-600 font-medium px-3 py-1.5 rounded-lg border border-teal-200 hover:border-teal-600 transition-all"
                                                >
                                                    <MessageCircle className="w-4 h-4" /> Message
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobApplications;
