import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
    X, Upload, FileText, CheckCircle, XCircle, AlertCircle,
    Zap, Target, BarChart2, Lightbulb, ArrowRight, Loader2
} from 'lucide-react';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const getScoreColor = (score) => {
    if (score >= 70) return { text: '#16a34a', bg: '#dcfce7', border: '#86efac', label: 'Strong Match', ring: '#22c55e' };
    if (score >= 50) return { text: '#d97706', bg: '#fef3c7', border: '#fcd34d', label: 'Moderate Match', ring: '#f59e0b' };
    if (score >= 30) return { text: '#dc2626', bg: '#fee2e2', border: '#fca5a5', label: 'Weak Match', ring: '#ef4444' };
    return { text: '#6b7280', bg: '#f3f4f6', border: '#d1d5db', label: 'Poor Match', ring: '#9ca3af' };
};

/* Animated SVG donut ring */
const ScoreRing = ({ score }) => {
    const [displayed, setDisplayed] = useState(0);
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const colors = getScoreColor(score);
    const offset = circumference - (displayed / 100) * circumference;

    useEffect(() => {
        let start = 0;
        const step = score / 60; // ~60 frames
        const interval = setInterval(() => {
            start += step;
            if (start >= score) { setDisplayed(score); clearInterval(interval); }
            else setDisplayed(Math.round(start));
        }, 16);
        return () => clearInterval(interval);
    }, [score]);

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width="140" height="140" className="-rotate-90">
                {/* Track */}
                <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
                {/* Progress */}
                <circle
                    cx="70" cy="70" r={radius}
                    fill="none"
                    stroke={colors.ring}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black" style={{ color: colors.text }}>{displayed}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-0.5">ATS Score</span>
            </div>
        </div>
    );
};

/* ─── Main Modal ────────────────────────────────────────────────────────────── */

/**
 * Props:
 *   job       – { id, title, company }
 *   onClose   – () => void
 *   onApply   – () => void   (called when "Apply Now" is clicked inside the modal)
 */
const ATSScoreModal = ({ job, onClose, onApply }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    // Close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    // Close on Escape key
    useEffect(() => {
        const down = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', down);
        return () => window.removeEventListener('keydown', down);
    }, [onClose]);

    const handleFileSelect = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        if (f.type !== 'application/pdf') { setError('Please select a PDF file'); return; }
        if (f.size > 5 * 1024 * 1024) { setError('File must be under 5 MB'); return; }
        setFile(f);
        setError('');
        setResult(null);
    };

    const handleCheck = async () => {
        if (!file) { setError('Please upload your resume first'); return; }
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const formData = new FormData();
            formData.append('resume', file);

            const res = await axios.post(
                `http://localhost:5000/api/ai/ats-check/${job.id}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const colors = result ? getScoreColor(result.overallScore) : null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={handleBackdropClick}
        >
            <div
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                style={{ animation: 'atsModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
            >
                {/* ── Header ──────────────────────────────────────────── */}
                <div className="flex items-start justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-gray-900">ATS Score Checker</h2>
                            <p className="text-sm text-gray-500 font-medium">
                                {job.title} · <span className="text-violet-600">{job.company}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">

                    {/* ── Upload Area ──────────────────────────────────── */}
                    {!result && (
                        <div>
                            <p className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-violet-500" />
                                Upload your resume to check compatibility with this job
                            </p>

                            <label
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all
                                    ${file
                                        ? 'border-violet-400 bg-violet-50'
                                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-violet-300'
                                    }`}
                            >
                                {file ? (
                                    <div className="flex flex-col items-center gap-2 text-violet-700">
                                        <CheckCircle className="w-8 h-8 text-violet-500" />
                                        <span className="text-sm font-bold">{file.name}</span>
                                        <span className="text-xs text-violet-400">Click to change file</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <Upload className="w-8 h-8" />
                                        <span className="text-sm font-semibold text-gray-600">Click to upload resume</span>
                                        <span className="text-xs">PDF only · Max 5MB</span>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
                            </label>

                            {error && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleCheck}
                                disabled={loading || !file}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm
                                    bg-gradient-to-r from-violet-600 to-indigo-600
                                    hover:from-violet-700 hover:to-indigo-700
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    shadow-lg shadow-violet-200 transition-all active:scale-[0.98]"
                            >
                                {loading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Analysing your resume...</>
                                ) : (
                                    <><Zap className="w-5 h-5" /> Check ATS Score</>
                                )}
                            </button>
                        </div>
                    )}

                    {/* ── Results ──────────────────────────────────────── */}
                    {result && (
                        <div style={{ animation: 'atsModalIn 0.3s ease' }}>

                            {/* Score Ring + Match Label */}
                            <div
                                className="rounded-2xl p-6 flex flex-col items-center gap-3 mb-5"
                                style={{ background: colors.bg, border: `1.5px solid ${colors.border}` }}
                            >
                                <ScoreRing score={result.overallScore} />
                                <span
                                    className="px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest"
                                    style={{ background: colors.border, color: colors.text }}
                                >
                                    {colors.label}
                                </span>
                                <p className="text-xs text-gray-500 text-center max-w-xs">
                                    Based on semantic understanding, keyword overlap, and domain alignment with this job description
                                </p>
                            </div>

                            {/* Sub-scores */}
                            <div className="grid grid-cols-2 gap-3 mb-5">
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BarChart2 className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Semantic Match</span>
                                    </div>
                                    <div className="text-2xl font-black text-blue-700">{result.semanticScore}%</div>
                                    <div className="mt-2 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-700"
                                            style={{ width: `${result.semanticScore}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-blue-500 mt-1">Context & experience alignment</p>
                                </div>

                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-4 h-4 text-amber-500" />
                                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Keyword Match</span>
                                    </div>
                                    <div className="text-2xl font-black text-amber-700">{result.keywordScore}%</div>
                                    <div className="mt-2 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 rounded-full transition-all duration-700"
                                            style={{ width: `${result.keywordScore}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-amber-500 mt-1">Skills matched in job description</p>
                                </div>
                            </div>

                            {/* Matched Skills */}
                            {result.matchedSkills?.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Skills You Have ({result.matchedSkills.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {result.matchedSkills.map(skill => (
                                            <span key={skill} className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
                                                ✓ {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Missing Skills */}
                            {result.missingSkills?.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <XCircle className="w-4 h-4 text-red-400" />
                                        Skills to Develop ({result.missingSkills.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {result.missingSkills.map(skill => (
                                            <span key={skill} className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-semibold">
                                                ✗ {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendation */}
                            {result.recommendation && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-5">
                                    <div className="flex items-start gap-2">
                                        <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">AI Recommendation</p>
                                            <p className="text-sm text-indigo-800 leading-relaxed">{result.recommendation}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setResult(null); setFile(null); }}
                                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition"
                                >
                                    Re-check with Different Resume
                                </button>
                                <button
                                    onClick={() => { onApply(); onClose(); }}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm
                                        hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-200 transition flex items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    Apply Now <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Keyframe animation injected once */}
            <style>{`
                @keyframes atsModalIn {
                    from { opacity: 0; transform: scale(0.92) translateY(10px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0px); }
                }
            `}</style>
        </div>
    );
};

export default ATSScoreModal;
