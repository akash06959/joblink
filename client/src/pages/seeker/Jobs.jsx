import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { MapPin, Clock, DollarSign, Share2, Heart, Filter, MessageCircle, Zap, Loader2 } from 'lucide-react';
import ATSScoreModal from '../../components/ATSScoreModal';

const Jobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [appliedJobIds, setAppliedJobIds] = useState(new Set()); // track already-applied jobs
    const [applyingJobId, setApplyingJobId] = useState(null);
    const applyingJobIdRef = useRef(null); // ref to avoid stale closure in handleFileChange
    const [atsJob, setAtsJob] = useState(null); // { id, title, company } for the ATS modal
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);

    const [filters, setFilters] = useState({
        types: [],
        experience: ''
    });

    // Fetch jobs
    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                const searchParams = new URLSearchParams(location.search);
                const query = searchParams.get('search') || '';

                const res = await axios.get('http://localhost:5000/api/jobs');
                let fetchedJobs = res.data.filter(job => job.type !== 'Mentorship');

                if (query) {
                    fetchedJobs = fetchedJobs.filter(job =>
                        job.title.toLowerCase().includes(query.toLowerCase()) ||
                        job.company.toLowerCase().includes(query.toLowerCase()) ||
                        job.description.toLowerCase().includes(query.toLowerCase())
                    );
                }

                if (filters.types.length > 0) {
                    fetchedJobs = fetchedJobs.filter(job =>
                        filters.types.some(type => job.type.toLowerCase().includes(type.toLowerCase()))
                    );
                }

                setJobs(fetchedJobs);
            } catch (err) {
                console.error('Error fetching jobs:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [location.search, filters]);

    // Fetch user's existing applications to know which jobs are already applied
    useEffect(() => {
        const fetchMyApplications = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (!user.token || user.role !== 'Seeker') return;
                const res = await axios.get('http://localhost:5000/api/applications/my-applications', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                const ids = new Set(res.data.map(app => app.jobId));
                setAppliedJobIds(ids);
            } catch (err) {
                // silently ignore — user may not be logged in
            }
        };
        fetchMyApplications();
    }, []);

    const handleTypeChange = (type) => {
        setFilters(prev => {
            const newTypes = prev.types.includes(type)
                ? prev.types.filter(t => t !== type)
                : [...prev.types, type];
            return { ...prev, types: newTypes };
        });
    };

    const clearFilters = () => {
        setFilters({ types: [], experience: '' });
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        const radios = document.querySelectorAll('input[type="radio"]');
        radios.forEach(r => r.checked = false);
    };

    const [submittingJobId, setSubmittingJobId] = useState(null); // tracks which job is being submitted

    const submitApplication = async (jobId, formData, token) => {
        await axios.post('http://localhost:5000/api/applications', formData, {
            headers: {
                ...(formData instanceof FormData
                    ? { 'Content-Type': 'multipart/form-data' }
                    : { 'Content-Type': 'application/json' }),
                'Authorization': `Bearer ${token}`
            }
        });
        setAppliedJobIds(prev => new Set([...prev, jobId]));
        toast.success('Application submitted! 🎉 Check "My Applications" to track your status.', { duration: 5000 });
    };

    const onApplyClick = async (jobId) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.token) {
            toast.error('You must be logged in to apply.');
            navigate('/login');
            return;
        }

        const hasSkills = user.skills && (
            (typeof user.skills === 'string' && user.skills.trim() !== '') ||
            (Array.isArray(user.skills) && user.skills.length > 0)
        );

        if (!hasSkills) {
            toast.error('Please update your skills in your Profile before applying.');
            navigate('/seeker/profile');
            return;
        }

        // If user has a saved profile resume → one-click apply immediately
        if (user.resume) {
            setSubmittingJobId(jobId);
            try {
                await submitApplication(jobId, { jobId, useProfileResume: true }, user.token);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Application failed. Please try again.');
            } finally {
                setSubmittingJobId(null);
            }
        } else {
            // No profile resume — open file picker
            applyingJobIdRef.current = jobId;
            setApplyingJobId(jobId);
            if (fileInputRef.current) fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        e.target.value = ''; // reset so same file can be picked again
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Please select a PDF file.');
            return;
        }

        const currentJobId = applyingJobIdRef.current;
        if (!currentJobId) {
            toast.error('Could not determine which job to apply to. Please try again.');
            return;
        }

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.token) {
            toast.error('You must be logged in to apply.');
            navigate('/login');
            return;
        }

        setSubmittingJobId(currentJobId);
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jobId', currentJobId);

        try {
            await submitApplication(currentJobId, formData, user.token);
        } catch (error) {
            console.error('Application error:', error);
            toast.error(error.response?.data?.message || 'Application failed. Please try again.');
        } finally {
            setSubmittingJobId(null);
            setApplyingJobId(null);
            applyingJobIdRef.current = null;
        }
    };

    const getInitials = (name) => name ? name.substring(0, 1).toUpperCase() : 'C';

    return (
        <>
            <div className="flex flex-col md:flex-row gap-8 font-sans">
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".pdf"
                    onChange={handleFileChange}
                />

                {/* FILTERS SIDEBAR */}
                <div className="w-full md:w-64 shrink-0 hidden md:block">
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Filters
                            </h3>
                            <span onClick={clearFilters} className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Clear All</span>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Job Type</h4>
                            <div className="space-y-2">
                                {['Full-time', 'Internship', 'Contract', 'Remote'].map(type => (
                                    <label key={type} className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                                        <div className={`w-4 h-4 border border-gray-300 rounded flex items-center justify-center ${filters.types.includes(type) ? 'bg-blue-600 border-transparent' : ''}`}>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={filters.types.includes(type)}
                                                onChange={() => handleTypeChange(type)}
                                            />
                                            {filters.types.includes(type) && <div className="text-white text-xs">✓</div>}
                                        </div>
                                        {type}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6 opacity-50 pointer-events-none">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Experience (Coming Soon)</h4>
                            <div className="space-y-2">
                                {['Fresher', '0-2 Years', '3-5 Years', '5+ Years'].map(exp => (
                                    <label key={exp} className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                                        <input type="radio" name="exp" className="accent-blue-600" disabled />
                                        {exp}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* MAIN FEED */}
                <div className="flex-1">
                    {/* HERO BANNER */}
                    <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white relative overflow-hidden hidden sm:block">
                        <div className="relative z-10">
                            <h1 className="text-3xl font-bold mb-2">Find Your Dream Job</h1>
                            <p className="text-blue-100 max-w-lg mb-6">Explore thousands of job opportunities and internships from top companies.</p>
                            <button className="bg-white text-blue-700 font-bold px-6 py-2.5 rounded-full hover:bg-blue-50 transition">
                                Explore Now
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/3 translate-y-1/3 blur-2xl"></div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Latest Opportunities ({jobs.length})</h2>
                        <div className="flex gap-2">
                            <select className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-100">
                                <option>Sort by: Newest</option>
                                <option>Salary: High to Low</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            <div className="p-10 text-center text-gray-500">Loading jobs...</div>
                        ) : jobs.map((job) => {
                            const user = JSON.parse(localStorage.getItem('user') || '{}');
                            const isRecruiter = user.role === 'Recruiter';

                            return (
                                <div
                                    key={job.id}
                                    onClick={() => navigate(`/seeker/jobs/${job.id}`)}
                                    className="bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 group cursor-pointer relative"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-4">
                                                <div className="w-14 h-14 rounded-lg border border-gray-100 flex items-center justify-center bg-gray-50 shrink-0 text-xl font-bold text-gray-400">
                                                    {getInitials(job.company)}
                                                </div>

                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                        {job.title}
                                                    </h3>
                                                    <p className="text-sm font-medium text-gray-500 mb-3">{job.company}</p>

                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 flex items-center gap-1.5">
                                                            <MapPin className="w-3 h-3" /> {job.location}
                                                        </span>
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 flex items-center gap-1.5">
                                                            <Clock className="w-3 h-3" /> {job.type}
                                                        </span>
                                                        {job.salary && (
                                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 flex items-center gap-1.5">
                                                                {job.salary.includes('₹') || job.salary.includes('$') || job.salary.includes('€') ?
                                                                    job.salary : `<DollarSign className="w-3 h-3" /> ${job.salary}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side Actions */}
                                        <div className="flex flex-col items-end gap-3 ml-4">
                                            <div className="flex gap-2">
                                                <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition">
                                                    <Heart className="w-5 h-5" />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
                                                    <Share2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Meta & Action */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">Promoted</span>
                                            <span>•</span>
                                            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                                        </div>

                                        {isRecruiter ? (
                                            <button disabled className="text-sm font-semibold text-gray-400 cursor-not-allowed">
                                                Recruiter View
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                {/* ⚡ ATS Score Check */}
                                                <button
                                                    onClick={() => setAtsJob({ id: job.id, title: job.title, company: job.company })}
                                                    className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full border-2 border-violet-500 text-violet-600 hover:bg-violet-50 active:scale-95 transition"
                                                >
                                                    <Zap className="w-3.5 h-3.5" />
                                                    ATS Score
                                                </button>

                                                {job.recruiterId && (
                                                    <button
                                                        onClick={() => navigate(
                                                            `/seeker/messages?recruiterId=${job.recruiterId}` +
                                                            `&name=${encodeURIComponent(job.company || 'HR')}` +
                                                            `&jobTitle=${encodeURIComponent(job.title)}`
                                                        )}
                                                        className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-95 transition"
                                                    >
                                                        <MessageCircle className="w-3.5 h-3.5" />
                                                        Message HR
                                                    </button>
                                                )}
                                                {appliedJobIds.has(job.id) ? (
                                                    <button
                                                        disabled
                                                        className="flex items-center gap-1.5 bg-green-50 text-green-700 text-sm font-bold px-6 py-2 rounded-full border-2 border-green-300 cursor-default select-none"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Applied
                                                    </button>
                                                ) : submittingJobId === job.id ? (
                                                    <button
                                                        disabled
                                                        className="bg-blue-400 flex items-center gap-2 text-white text-sm font-bold px-6 py-2 rounded-full cursor-not-allowed"
                                                    >
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Applying...
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => onApplyClick(job.id)}
                                                        className="bg-blue-600 text-white text-sm font-bold px-6 py-2 rounded-full hover:bg-blue-700 active:scale-95 transition shadow-sm hover:shadow-md"
                                                    >
                                                        Apply Now
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ATS Score Modal */}
            {atsJob && (
                <ATSScoreModal
                    job={atsJob}
                    onClose={() => setAtsJob(null)}
                    onApply={() => {
                        onApplyClick(atsJob.id);
                        setAtsJob(null);
                    }}
                />
            )}
        </>
    );
};

export default Jobs;
