import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Upload, Briefcase, MapPin, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SmartMatch = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [skillsString, setSkillsString] = useState('');
    const [matchedJobs, setMatchedJobs] = useState([]);
    const [searched, setSearched] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleScan = async () => {
        if (!file) {
            toast.error('Please upload a resume first.');
            return;
        }

        const formData = new FormData();
        formData.append('resume', file);

        setLoading(true);
        setSearched(true);
        try {
            const res = await axios.post('http://localhost:5000/api/jobs/smart-filter', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log(res.data);
            if (res.data.skills) {
                setSkillsString(res.data.skills.join(', '));
            }
            setMatchedJobs(res.data.jobs || []);
        } catch (error) {
            console.error(error);
            // Handle HTTP 422 Unprocessable Error logic explicitly when ML fallback triggers Zero matches
            if (error.response && error.response.status === 422) {
                toast.error(error.response.data.message || 'AI engine unavailable. Ensure your PDF has selectable text.');
            } else {
                toast.error('Connection to Match Engine failed. Showing fallback results.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 mb-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Smart Resume Match</h1>
                <p className="text-blue-100">Upload your resume and let our AI find the perfect job matches for you based on your unique skills.</p>

                <div className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/30 border-dashed rounded-lg cursor-pointer hover:bg-white/10 transition">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-white" />
                                    <p className="mb-2 text-sm text-gray-100"><span className="font-semibold">Click to upload resume</span></p>
                                    <p className="text-xs text-gray-200">PDF (MAX. 5MB)</p>
                                </div>
                                <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                            </label>
                            {file && <p className="text-sm mt-2 text-center font-medium">Selected: {file.name}</p>}
                        </div>
                        <button
                            onClick={handleScan}
                            disabled={loading || !file}
                            className={`px-8 py-3 rounded-lg font-bold shadow-md transition w-full md:w-auto flex items-center justify-center gap-2
                                ${loading || !file ? 'bg-gray-400 cursor-not-allowed' : 'bg-white text-blue-700 hover:bg-gray-50'}`}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            {loading ? 'Analyzing...' : 'Find Matches'}
                        </button>
                    </div>
                </div>
            </div>

            {searched && !loading && (
                <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                    {/* Skills Detected */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-700 mb-3">AI Detected Skills:</h2>
                        <div className="flex flex-wrap gap-2">
                            {skillsString ? skillsString.split(', ').map(skill => (
                                <span key={skill} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium border border-green-200">
                                    {skill}
                                </span>
                            )) : <p className="text-gray-500 italic">No specific technical skills detected.</p>}
                        </div>
                    </div>

                    {/* Matched Jobs */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Matched Jobs ({matchedJobs.length})</h2>

                    {matchedJobs.length === 0 && !loading ? (
                        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                            <p className="text-gray-500 font-semibold mb-2">No jobs matched perfectly above the AI threshold.</p>
                            <button onClick={() => navigate('/seeker/jobs')} className="text-blue-600 font-medium px-4 py-2 hover:underline bg-blue-50 rounded-lg">Browse all jobs manually</button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {matchedJobs.map(job => (
                                <div key={job.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold text-blue-600">{job.title}</h3>
                                            <p className="text-gray-700 font-medium">{job.company}</p>
                                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                                                <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.type}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate('/seeker/jobs')}
                                            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 line-clamp-2">
                                        {job.description}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SmartMatch;
