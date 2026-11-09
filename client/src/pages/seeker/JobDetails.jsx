import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    MapPin, Clock, DollarSign, Briefcase, Calendar, Share2, Heart,
    CheckCircle, Globe, Building2, ArrowLeft, Users, Star, GraduationCap, MessageCircle, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ATSScoreModal from '../../components/ATSScoreModal';

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [atsOpen, setAtsOpen] = useState(false);
    const me = JSON.parse(localStorage.getItem('user') || '{}');
    const isRecruiter = me.role === 'Recruiter';

    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/jobs/${id}`);
                setJob(res.data);
            } catch (err) {
                console.error('Error fetching job details:', err);
                setError('Failed to load job details');
            } finally {
                setLoading(false);
            }
        };

        const checkAppliedStatus = async () => {
            if (isRecruiter) return;
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (!user.token) return;
                const res = await axios.get('http://localhost:5000/api/applications/my-applications', {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                const applied = res.data.some(app => app.jobId === parseInt(id));
                setHasApplied(applied);
            } catch (err) {
                console.error('Error checking application status:', err);
            }
        };

        fetchJobDetails();
        checkAppliedStatus();
    }, [id, isRecruiter]);

    const onApplyClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Please select a PDF file');
            return;
        }

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jobId', id);

        setApplying(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user.token;

            await axios.post('http://localhost:5000/api/applications', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            toast.success('Application Submitted Successfully!');
            setHasApplied(true);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Application failed');
        } finally {
            setApplying(false);
            e.target.value = null;
        }
    };

    const handleDirectApply = async () => {
        setApplying(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user.token;

            const formData = new FormData();
            formData.append('jobId', id);
            formData.append('useProfileResume', 'false'); // Let backend handle no resume logic

            await axios.post('http://localhost:5000/api/applications', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            toast.success('Application Submitted Successfully!');
            setHasApplied(true);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Application failed');
        } finally {
            setApplying(false);
        }
    };

    const getInitials = (name) => name ? name.substring(0, 1).toUpperCase() : 'C';

    if (loading) return <div className="p-10 text-center">Loading details...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
    if (!job) return null;

    return (
        <div className="w-full pb-10">
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf"
                onChange={handleFileChange}
            />

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* Header Content */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex items-start gap-5">
                        <div className="w-20 h-20 rounded-xl border border-gray-100 flex items-center justify-center bg-gray-50 shrink-0 text-3xl font-bold text-gray-400">
                            {getInitials(job.company)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
                            <div className="flex items-center gap-3 text-gray-600 mb-4">
                                <span className="font-medium text-lg">{job.company}</span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span className="text-sm flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> {job.location}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 flex items-center gap-1.5 border border-blue-100">
                                    <Briefcase className="w-3 h-3" /> {job.type}
                                </span>
                                {job.salary && (
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 flex items-center gap-1.5 border border-green-100">
                                        <DollarSign className="w-3 h-3" /> {job.salary}
                                    </span>
                                )}
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 flex items-center gap-1.5 border border-gray-200">
                                    <Clock className="w-3 h-3" /> Posted {new Date(job.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button className="p-2.5 border border-gray-200 rounded-full hover:bg-gray-50 transition text-gray-500">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button className="p-2.5 border border-gray-200 rounded-full hover:bg-red-50 hover:text-red-500 transition text-gray-500">
                            <Heart className="w-5 h-5" />
                        </button>

                        {!isRecruiter && job.recruiterId && (
                            <button
                                onClick={() => navigate(
                                    `/seeker/messages?recruiterId=${job.recruiterId}` +
                                    `&name=${encodeURIComponent(job.company || 'HR')}` +
                                    `&jobTitle=${encodeURIComponent(job.title)}`
                                )}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition active:scale-95"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Message HR
                            </button>
                        )}

                        {!isRecruiter && (
                            <>
                                {/* ATS Score Check button - only for regular jobs */}
                                {job.type !== 'Competition' && job.type !== 'Mentorship' && (
                                    <button
                                        onClick={() => setAtsOpen(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold border-2 border-violet-500 text-violet-600 hover:bg-violet-50 transition active:scale-95"
                                    >
                                        <Zap className="w-4 h-4" />
                                        Check ATS Score
                                    </button>
                                )}

                                <button
                                    onClick={(job.type === 'Competition' || job.type === 'Mentorship') ? handleDirectApply : onApplyClick}
                                    disabled={applying || hasApplied}
                                    className={`px-8 py-2.5 rounded-full font-bold transition shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${hasApplied
                                            ? 'bg-gray-300 text-gray-700 shadow-none'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                                        }`}
                                >
                                    {hasApplied ? (job.type === 'Competition' || job.type === 'Mentorship' ? 'Already Registered' : 'Already Applied') :
                                        applying ? 'Please wait...' :
                                            job.type === 'Competition' ? 'Register Now' :
                                                job.type === 'Mentorship' ? 'Apply for Mentorship' :
                                                    'Apply Now'}
                                </button>
                            </>
                        )}

                        {isRecruiter && (
                            <span className="text-sm text-gray-400 font-medium self-center">Recruiter View</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Description */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">About the Role</h2>
                        <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                            {job.description}
                        </div>
                    </div>

                    {job.responsibilities && job.responsibilities.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Key Responsibilities</h2>
                            <ul className="space-y-3">
                                {job.responsibilities.map((resp, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-600">
                                        <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                        <span>{resp}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Right Column: Sidebar */}
                <div className="space-y-6">
                    {/* Job Overview */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Job Overview</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Date Posted</p>
                                    <p className="text-sm font-medium text-gray-900">{new Date(job.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Location</p>
                                    <p className="text-sm font-medium text-gray-900">{job.location}</p>
                                </div>
                            </div>

                            {job.workMode && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Work Mode</p>
                                        <p className="text-sm font-medium text-gray-900">{job.workMode}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Offered Salary</p>
                                    <p className="text-sm font-medium text-gray-900">{job.salary || 'Not Disclosed'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Job Type</p>
                                    <p className="text-sm font-medium text-gray-900">{job.type}</p>
                                </div>
                            </div>

                            {job.experienceLevel && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                        <GraduationCap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Experience</p>
                                        <p className="text-sm font-medium text-gray-900">{job.experienceLevel}</p>
                                    </div>
                                </div>
                            )}

                            {job.industry && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Industry</p>
                                        <p className="text-sm font-medium text-gray-900">{job.industry}</p>
                                    </div>
                                </div>
                            )}

                            {job.applicationDeadline && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-50 rounded-lg text-red-500">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Apply Before</p>
                                        <p className="text-sm font-medium text-red-600">{new Date(job.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Required Skills */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {job.requirements && job.requirements.map(skill => (
                                <span key={skill} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium border border-gray-100">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Benefits */}
                    {job.benefits && job.benefits.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4">Benefits & Perks</h3>
                            <div className="flex flex-wrap gap-2">
                                {job.benefits.map(b => (
                                    <span key={b} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-100">
                                        <Star className="w-3 h-3" />{b}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ATS Score Modal */}
            {atsOpen && job && (
                <ATSScoreModal
                    job={{ id: job.id, title: job.title, company: job.company }}
                    onClose={() => setAtsOpen(false)}
                    onApply={() => {
                        setAtsOpen(false);
                        onApplyClick();
                    }}
                />
            )}
        </div>
    );
};

export default JobDetails;
