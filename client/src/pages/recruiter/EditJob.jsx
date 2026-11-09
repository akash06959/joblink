import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    Briefcase, Plus, X, ChevronDown,
    Globe, Building2, Home, Clock, Star, Trophy, Users,
    CalendarDays, Sparkles, CheckSquare, Layers
} from 'lucide-react';

/* ─── Static Data ─────────────────────────────── */
const JOB_TYPES = [
    { value: 'Full-time', icon: <Briefcase className="w-5 h-5" />, desc: 'Permanent employee position', activeBg: 'bg-teal-600', activeBorder: 'border-teal-600', activeText: 'text-teal-600', activeBgLight: 'bg-teal-50' },
    { value: 'Part-time', icon: <Clock className="w-5 h-5" />, desc: 'Flexible hours, reduced schedule', activeBg: 'bg-violet-600', activeBorder: 'border-violet-600', activeText: 'text-violet-600', activeBgLight: 'bg-violet-50' },
    { value: 'Internship', icon: <Star className="w-5 h-5" />, desc: 'Short-term learning opportunity', activeBg: 'bg-amber-500', activeBorder: 'border-amber-500', activeText: 'text-amber-600', activeBgLight: 'bg-amber-50' },
    { value: 'Contract', icon: <CheckSquare className="w-5 h-5" />, desc: 'Project-based fixed-term work', activeBg: 'bg-emerald-600', activeBorder: 'border-emerald-600', activeText: 'text-emerald-600', activeBgLight: 'bg-emerald-50' },
    { value: 'Mentorship', icon: <Users className="w-5 h-5" />, desc: 'Guidance & coaching sessions', activeBg: 'bg-pink-600', activeBorder: 'border-pink-600', activeText: 'text-pink-600', activeBgLight: 'bg-pink-50' },
    { value: 'Competition', icon: <Trophy className="w-5 h-5" />, desc: 'Hackathon or challenge event', activeBg: 'bg-orange-500', activeBorder: 'border-orange-500', activeText: 'text-orange-600', activeBgLight: 'bg-orange-50' },
];

const WORK_MODES = [
    { value: 'Remote', icon: <Globe className="w-4 h-4" />, desc: 'Work from anywhere' },
    { value: 'Hybrid', icon: <Home className="w-4 h-4" />, desc: 'Mix of remote & office' },
    { value: 'On-site', icon: <Building2 className="w-4 h-4" />, desc: 'Full-time in office' },
];

const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Manager', 'Executive'];
const INDUSTRIES = ['Technology', 'Finance & Banking', 'Healthcare', 'Education', 'Marketing & Advertising', 'Design & Creative', 'Sales', 'Engineering', 'Legal', 'Human Resources', 'Data & Analytics', 'Cybersecurity', 'E-commerce', 'Media & Entertainment', 'Other'];
const BENEFITS_LIST = ['Health Insurance', 'Dental & Vision', 'Remote Work Option', 'Flexible Hours', 'Stock Options / ESOP', '401k / Provident Fund', 'Gym Membership', 'Learning Budget', 'Visa Sponsorship', 'Relocation Assistance', 'Annual Bonus', 'Paid Time Off'];

/* ─── Shared UI ───────────────────────────────── */
const SectionCard = ({ icon, title, subtitle, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-teal-50 rounded-xl text-teal-600">{icon}</div>
            <div>
                <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
                {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
        {children}
    </div>
);

const FormLabel = ({ children, hint }) => (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {children}
        {hint && <span className="ml-1.5 text-xs font-normal text-gray-400">{hint}</span>}
    </label>
);

const Input = (props) => (
    <input
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
        {...props}
    />
);

const Select = ({ children, ...props }) => (
    <div className="relative">
        <select className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-9 text-sm text-gray-900 transition focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100" {...props}>
            {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    </div>
);

/* ─── Main ────────────────────────────────────── */
const EditJob = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [formData, setFormData] = useState({
        title: '', company: '', location: '', type: 'Full-time',
        workMode: 'On-site', experienceLevel: '', industry: '',
        salary: '', applicationDeadline: '', description: '', requirements: '',
    });

    const [responsibilities, setResponsibilities] = useState(['']);
    const [selectedBenefits, setSelectedBenefits] = useState([]);

    const { title, company, location, type, workMode, experienceLevel, industry, salary, applicationDeadline, description, requirements } = formData;

    useEffect(() => {
        (async () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user.token) { navigate('/login'); return; }
            try {
                const res = await axios.get('http://localhost:5000/api/jobs');
                const job = res.data.find(j => String(j.id) === String(id));
                if (job) {
                    setFormData({
                        title: job.title || '', company: job.company || '', location: job.location || '',
                        type: job.type || 'Full-time', workMode: job.workMode || 'On-site',
                        experienceLevel: job.experienceLevel || '', industry: job.industry || '',
                        salary: job.salary || '',
                        applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : '',
                        description: job.description || '',
                        requirements: Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements || '',
                    });
                    setResponsibilities(Array.isArray(job.responsibilities) && job.responsibilities.length > 0 ? job.responsibilities : ['']);
                    setSelectedBenefits(Array.isArray(job.benefits) ? job.benefits : []);
                } else {
                    toast.error('Job not found');
                    navigate('/recruiter/my-jobs');
                }
            } catch { toast.error('Failed to load job details.'); }
            finally { setFetching(false); }
        })();
    }, [id, navigate]);

    const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));
    const onChange = e => set(e.target.name, e.target.value);
    const toggleBenefit = b => setSelectedBenefits(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]);
    const addResp = () => setResponsibilities(p => [...p, '']);
    const updateResp = (i, v) => setResponsibilities(p => p.map((r, idx) => idx === i ? v : r));
    const removeResp = i => setResponsibilities(p => p.filter((_, idx) => idx !== i));

    const selectedType = JOB_TYPES.find(t => t.value === type);
    const getTypeLabel = () => type === 'Competition' ? 'Competition' : type === 'Mentorship' ? 'Mentorship Session' : 'Job';

    const onSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        try {
            await axios.put(`http://localhost:5000/api/jobs/${id}`, {
                title, company, location, type, workMode, experienceLevel, industry,
                salary, applicationDeadline: applicationDeadline || null, description,
                requirements: requirements.split(',').map(r => r.trim()).filter(Boolean),
                responsibilities: responsibilities.map(r => r.trim()).filter(Boolean),
                benefits: selectedBenefits,
            }, { headers: { Authorization: `Bearer ${user.token}` } });
            toast.success(`${getTypeLabel()} updated successfully! ✅`);
            navigate('/recruiter/my-jobs');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update. Please try again.');
        } finally { setLoading(false); }
    };

    if (fetching) return (
        <div className="flex items-center justify-center min-h-[60vh] gap-3 text-gray-500 text-sm">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading…
        </div>
    );

    return (
        <div className="min-h-screen py-4 px-0">
            <form onSubmit={onSubmit} className="w-full">

                {/* Header */}
                <div className="flex items-center gap-3 mb-7">
                    <div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-md shadow-amber-200">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Edit Opportunity</h1>
                        <p className="text-xs text-gray-500">Update any details for this posting.</p>
                    </div>
                </div>

                <div className="flex gap-6 items-start">

                    {/* ══ LEFT SIDEBAR ══ */}
                    <div className="w-56 shrink-0 sticky top-6">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Type</p>
                            </div>
                            <div className="p-2 space-y-1">
                                {JOB_TYPES.map(({ value, icon, desc, activeBorder, activeText, activeBgLight }) => (
                                    <button
                                        key={value} type="button" onClick={() => set('type', value)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${type === value
                                            ? `${activeBgLight} ${activeBorder} border`
                                            : 'hover:bg-gray-50 border border-transparent'
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-lg transition-colors ${type === value ? `${activeBgLight} ${activeText}` : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'
                                            }`}>{icon}</div>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-semibold truncate ${type === value ? activeText : 'text-gray-700'}`}>{value}</p>
                                            <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">{desc}</p>
                                        </div>
                                        {type === value && (
                                            <div className={`ml-auto w-1.5 h-1.5 rounded-full shrink-0 ${activeBorder.replace('border-', 'bg-')}`} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedType && (
                            <div className={`mt-3 rounded-xl ${selectedType.activeBgLight} border ${selectedType.activeBorder} px-4 py-3`}>
                                <p className="text-xs text-gray-500 font-medium mb-1">Selected</p>
                                <div className="flex items-center gap-2">
                                    <span className={selectedType.activeText}>{selectedType.icon}</span>
                                    <span className={`text-sm font-bold ${selectedType.activeText}`}>{type}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 leading-snug">{selectedType.desc}</p>
                            </div>
                        )}
                    </div>

                    {/* ══ RIGHT — Form ══ */}
                    <div className="flex-1 min-w-0 space-y-5">

                        {/* Basic Info */}
                        <SectionCard icon={<Star className="w-4 h-4" />} title="Basic Information">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <FormLabel>{type === 'Mentorship' ? 'Session Title' : type === 'Competition' ? 'Competition Title' : 'Job Title'} <span className="text-red-400">*</span></FormLabel>
                                    <Input name="title" value={title} onChange={onChange} required placeholder="e.g. Senior Full-Stack Engineer" />
                                </div>
                                <div>
                                    <FormLabel>Company / Organization <span className="text-red-400">*</span></FormLabel>
                                    <Input name="company" value={company} onChange={onChange} required placeholder="e.g. Google" />
                                </div>
                                <div>
                                    <FormLabel>Industry</FormLabel>
                                    <Select name="industry" value={industry} onChange={onChange}>
                                        <option value="">Select industry…</option>
                                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <FormLabel>{type === 'Competition' ? 'Prize Pool' : 'Salary Range'}</FormLabel>
                                    <Input name="salary" value={salary} onChange={onChange} placeholder="e.g. ₹12L – ₹18L p.a." />
                                </div>
                                <div>
                                    <FormLabel>Application Deadline</FormLabel>
                                    <input type="date" name="applicationDeadline" value={applicationDeadline} onChange={onChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
                                    />
                                </div>
                            </div>
                        </SectionCard>

                        {/* Work Mode */}
                        <SectionCard icon={<Globe className="w-4 h-4" />} title="Work Mode & Location">
                            <div className="mb-4">
                                <FormLabel>Work Mode</FormLabel>
                                <div className="flex gap-2">
                                    {WORK_MODES.map(({ value, icon }) => (
                                        <label key={value}
                                            className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 cursor-pointer transition-all duration-150 ${workMode === value ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white'
                                                }`}
                                        >
                                            <input type="radio" name="workMode" value={value} checked={workMode === value} onChange={() => set('workMode', value)} className="sr-only" />
                                            <span className={`p-1.5 rounded-lg ${workMode === value ? 'bg-teal-100' : 'bg-white border border-gray-200'}`}>{icon}</span>
                                            <span className="text-xs font-semibold">{value}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <FormLabel>Location <span className="text-red-400">*</span></FormLabel>
                                <Input name="location" value={location} onChange={onChange} required={workMode !== 'Remote'}
                                    placeholder={workMode === 'Remote' ? 'Worldwide / Country (optional)' : 'e.g. Bengaluru, India'} />
                            </div>
                        </SectionCard>

                        {/* Requirements */}
                        <SectionCard icon={<CheckSquare className="w-4 h-4" />} title="Requirements">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <FormLabel>Experience Level</FormLabel>
                                    <Select name="experienceLevel" value={experienceLevel} onChange={onChange}>
                                        <option value="">Select level…</option>
                                        {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <FormLabel hint="(comma separated)">Skills Required</FormLabel>
                                    <Input name="requirements" value={requirements} onChange={onChange} placeholder="e.g. React, Node.js" />
                                </div>
                                <div className="sm:col-span-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <FormLabel>Key Responsibilities</FormLabel>
                                        <button type="button" onClick={addResp} className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                                            <Plus className="w-3.5 h-3.5" /> Add
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {responsibilities.map((r, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                                                <Input value={r} onChange={e => updateResp(i, e.target.value)} placeholder={`Responsibility ${i + 1}…`} />
                                                {responsibilities.length > 1 && (
                                                    <button type="button" onClick={() => removeResp(i)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Benefits */}
                        <SectionCard icon={<Layers className="w-4 h-4" />} title="Benefits & Perks" subtitle="Select all that apply">
                            <div className="grid grid-cols-2 gap-2">
                                {BENEFITS_LIST.map(b => {
                                    const on = selectedBenefits.includes(b);
                                    return (
                                        <button key={b} type="button" onClick={() => toggleBenefit(b)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all text-left ${on ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'
                                                }`}
                                        >
                                            <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${on ? 'bg-teal-600 border-teal-600' : 'border-gray-300'}`}>
                                                {on && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                            </div>
                                            {b}
                                        </button>
                                    );
                                })}
                            </div>
                        </SectionCard>

                        {/* Description */}
                        <SectionCard icon={<CalendarDays className="w-4 h-4" />} title="Full Description">
                            <textarea name="description" value={description} onChange={onChange} rows={7} required
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 resize-y"
                                placeholder="Describe the role, culture, day-to-day work, and growth opportunities…"
                            />
                        </SectionCard>

                        {/* Submit */}
                        <div className="flex items-center justify-between pb-8">
                            <button type="button" onClick={() => navigate('/recruiter/my-jobs')}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading}
                                className={`flex items-center gap-2 px-7 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold shadow-md transition-all hover:bg-amber-600 active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                {loading ? (
                                    <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>Saving…</>
                                ) : (
                                    <><Sparkles className="w-4 h-4" />Save Changes</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditJob;
