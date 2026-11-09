import { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, AlertCircle, Sparkles, Briefcase, MapPin, Building, TrendingUp, Target } from 'lucide-react';

const ResumeAnalyzer = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [matchingJobs, setMatchingJobs] = useState([]);
    const [suggestedRoles, setSuggestedRoles] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                setError('Please upload a PDF file');
                setFile(null);
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
                setError('File size should be less than 5MB');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    const handleAnalyze = async () => {
        if (!file) {
            setError('Please upload a resume');
            return;
        }

        setLoading(true);
        setError('');
        setMatchingJobs([]);
        setSuggestedRoles(null);

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user.token;

            const formData = new FormData();
            formData.append('resume', file);

            const res = await axios.post('http://localhost:5000/api/ai/smart-match', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            setMatchingJobs(res.data.matchingJobs || []);
            setSuggestedRoles(res.data.suggestedRoles || null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to analyze resume. Please try again.');
            console.error('Error analyzing resume:', err);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-green-50 border-green-200';
        if (score >= 60) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    return (
        <div className="w-full py-4">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Smart Job Matcher</h1>
                        <p className="text-gray-500 mt-1">Upload your resume and discover perfect job matches from available opportunities</p>
                    </div>
                </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-4">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Upload Your Resume (PDF)
                </label>
                <div className="flex gap-4 items-start">
                    <label className="flex-1 flex flex-col items-center justify-center h-40 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">PDF (MAX. 5MB)</p>
                            {file && (
                                <p className="mt-2 text-sm text-green-600 font-medium">✓ {file.name}</p>
                            )}
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf"
                            onChange={handleFileChange}
                        />
                    </label>

                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !file}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-40"
                    >
                        {loading ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                <span className="text-sm">Analyzing...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Sparkles className="w-8 h-8" />
                                <span>Find Matches</span>
                            </div>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}
            </div>

            {/* Suggested Roles */}
            {suggestedRoles?.recommended_roles?.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8 mb-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Target className="w-7 h-7 text-blue-600" />
                        AI Recommended Roles
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {suggestedRoles.recommended_roles.map((roleObj, index) => (
                            <div key={index} className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors text-lg">{roleObj.role}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {suggestedRoles.career_advice && (
                        <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2 uppercase tracking-wide">
                                <TrendingUp className="w-5 h-5 text-blue-600" /> Strategic Career Advice
                            </h4>
                            <p className="text-gray-700 leading-relaxed">
                                {suggestedRoles.career_advice.split(/(\*\*.*?\*\*)/).map((part, i) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return <strong key={i} className="text-gray-900 bg-blue-50 px-1 rounded">{part.slice(2, -2)}</strong>;
                                    }
                                    return part;
                                })}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Matching Jobs */}
            {matchingJobs.filter(job => job.type !== 'Mentorship' && job.type !== 'Program').length > 0 ? (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-purple-600" />
                        Top Matching Jobs ({matchingJobs.filter(job => job.type !== 'Mentorship' && job.type !== 'Program').length})
                    </h2>
                    <div className="grid gap-6">
                        {matchingJobs.filter(job => job.type !== 'Mentorship' && job.type !== 'Program').map((job) => (
                            <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <Building className="w-4 h-4" />
                                                    {job.company}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {job.location}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`px-6 py-3 rounded-xl border-2 ${getScoreBg(job.matchScore)}`}>
                                            <div className="text-center">
                                                <div className={`text-3xl font-extrabold ${getScoreColor(job.matchScore)}`}>
                                                    {job.matchScore}%
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">Match</p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">{job.description}</p>

                                    {/* AI Transparency Section: Skills Breakdown */}
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Matched Skills */}
                                            <div>
                                                <h4 className="text-sm font-bold text-green-700 flex items-center gap-1 mb-2">
                                                    <span className="text-green-500">✓</span> Matched Skills
                                                </h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {job.matchedQualifications && job.matchedQualifications.length > 0 ? (
                                                        job.matchedQualifications.slice(0, 5).map((skill, i) => (
                                                            <span key={i} className="px-2 py-1 bg-green-100/50 border border-green-200 text-green-700 text-xs rounded-md">
                                                                {skill}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-500 italic">No specific exact matches parsed</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Missing Skills */}
                                            <div>
                                                <h4 className="text-sm font-bold text-amber-600 flex items-center gap-1 mb-2">
                                                    <span className="text-amber-500">⚠</span> Missing Critical Skills
                                                </h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {job.missingRequirements && job.missingRequirements.length > 0 ? (
                                                        job.missingRequirements.slice(0, 5).map((skill, i) => (
                                                            <span key={i} className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-md">
                                                                {skill}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-500 italic">No critical missing skills</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Score Explanation */}
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <p className="text-xs text-gray-600">
                                                <span className="font-semibold text-blue-700">{job.semanticScore || job.matchScore}%</span> contextual industry match | <span className="font-semibold text-purple-700">{job.keywordScore || job.matchScore}%</span> specific ATS keyword alignment.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                                                {job.type}
                                            </span>
                                            {job.salary && (
                                                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                                    {job.salary.includes('₹') || job.salary.includes('$') ? job.salary : `₹${job.salary}`}
                                                </span>
                                            )}
                                        </div>
                                        <a
                                            href={`/seeker/jobs?id=${job.id}`}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm transition"
                                        >
                                            View & Apply
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : !loading && file && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Briefcase className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Matching Jobs Found</h3>
                    <p className="text-gray-600">
                        We couldn't find any jobs matching your resume at the moment. Try checking back later!
                    </p>
                </div>
            )}

            {!file && !loading && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-dashed border-purple-200 p-12 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Sparkles className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Find Your Perfect Job?</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Upload your resume and our AI will analyze it against all available jobs to find the best matches for you
                    </p>
                </div>
            )}
        </div>
    );
};

export default ResumeAnalyzer;
