import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { User, Mail, MapPin, Briefcase, Camera, Edit2, Trash2, Loader2, Zap } from 'lucide-react';

const Profile = () => {
    // Initialize state from local storage or empty defaults
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef(null);      // resume
    const avatarInputRef = useRef(null);    // profile picture
    const [uploading, setUploading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [deletingResume, setDeletingResume] = useState(false);
    const [extractingProfile, setExtractingProfile] = useState(false);

    // Form state for editing
    const [formData, setFormData] = useState({
        name: user.name || '',
        headline: user.headline || '',
        location: user.location || '',
        about: user.about || '',
        skills: user.skills ? (Array.isArray(user.skills) ? user.skills.join(', ') : user.skills) : '',
        education: user.education || '',
    });

    // Fetch latest user data on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
                if (!token) return;

                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                const res = await axios.get('http://localhost:5000/api/auth/me', config);

                // Merge token back in since getMe doesn't return it
                const updatedUser = { ...res.data, token };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Update form data
                setFormData({
                    name: res.data.name || '',
                    headline: res.data.headline || '',
                    location: res.data.location || '',
                    about: res.data.about || '',
                    skills: res.data.skills ? (Array.isArray(res.data.skills) ? res.data.skills.join(', ') : res.data.skills) : '',
                    education: res.data.education || '',
                });
            } catch (err) {
                console.error('Error fetching user data:', err);
            }
        };
        fetchUserData();
    }, []); // Empty dependency array to run once on mount

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        try {
            const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            // Convert skills string back to array if needed (simple comma separation)
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);

            const payload = {
                ...formData,
                skills: skillsArray
            };

            const res = await axios.put('http://localhost:5000/api/auth/profile', payload, config);

            // Update local state
            const updatedUser = { ...res.data, token };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // Notify navbar UserAvatar to refresh
            window.dispatchEvent(new Event('storage'));
            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    /* ── Avatar upload ── */
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file (JPG, PNG, WebP…)');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be under 2 MB');
            return;
        }

        const fd = new FormData();
        fd.append('avatar', file);
        setUploadingAvatar(true);

        try {
            const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
            const res = await axios.post('http://localhost:5000/api/auth/avatar', fd, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            const updatedUser = { ...user, avatar: res.data.avatar };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // Notify other components (e.g. navbar UserAvatar) to refresh
            window.dispatchEvent(new Event('storage'));
            toast.success('Profile picture updated!');
        } catch (err) {
            console.error('Avatar upload error:', err);
            toast.error(err.response?.data?.message || 'Failed to upload picture');
        } finally {
            setUploadingAvatar(false);
            e.target.value = null;
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (file.type !== 'application/pdf') {
            toast.error('Please upload a PDF file');
            return;
        }

        const formDataParams = new FormData();
        formDataParams.append('resume', file);
        setUploading(true);

        try {
            const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            };

            const res = await axios.post('http://localhost:5000/api/auth/resume', formDataParams, config);

            // Capture the newly extracted skills from backend too
            const newSkills = res.data.skills || user.skills;
            const updatedUser = { ...user, resume: res.data.resume, skills: newSkills };
            setUser(updatedUser);
            setFormData(prev => ({
                ...prev,
                skills: newSkills ? (Array.isArray(newSkills) ? newSkills.join(', ') : newSkills) : prev.skills
            }));
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // Trigger storage event so other tabs/components update
            window.dispatchEvent(new Event('storage'));
            toast.success('Resume uploaded successfully! 🎉');
        } catch (error) {
            console.error('Error uploading resume:', error);
            toast.error(error.response?.data?.message || 'Failed to upload resume');
        } finally {
            setUploading(false);
        }
    };

    const handleResumeDelete = async () => {
        if (!window.confirm('Are you sure you want to delete your resume?')) return;

        setDeletingResume(true);
        try {
            const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };

            await axios.delete('http://localhost:5000/api/auth/resume', config);

            const updatedUser = { ...user, resume: null };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('storage'));
            toast.success('Resume deleted successfully!');
        } catch (error) {
            console.error('Error deleting resume:', error);
            toast.error(error.response?.data?.message || 'Failed to delete resume');
        } finally {
            setDeletingResume(false);
        }
    };

    const handleExtractProfile = async () => {
        if (!user.resume) {
            toast.error('Please upload a resume first to extract details from it.');
            return;
        }

        setExtractingProfile(true);
        try {
            const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post('http://localhost:5000/api/auth/extract-profile', {}, config);

            // Populate form
            setFormData(prev => ({
                ...prev,
                about: res.data.about || prev.about,
                skills: res.data.skills?.length > 0 ? (Array.isArray(res.data.skills) ? res.data.skills.join(', ') : res.data.skills) : prev.skills,
                education: res.data.education || prev.education
            }));

            // Turn on editing mode so user can review and save updates
            setIsEditing(true);
            toast.success('Details auto-filled! Please review and click Save Changes.');
        } catch (error) {
            console.error('Extraction error:', error);
            toast.error(error.response?.data?.message || 'Failed to auto-fill details. Please try again.');
        } finally {
            setExtractingProfile(false);
        }
    };

    return (
        <div className="w-full font-sans pb-12 animate-fade-in">
            {/* Hidden file inputs */}
            <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
                className="hidden"
                accept="image/*"
            />
            {/* Compact Header / Cover Image */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative mb-6 group">
                <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/5"></div>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

                    <button className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-md transition shadow-sm border border-white/20">
                        <Camera className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-end md:items-center gap-6">
                    {/* Profile Image - overlapped */}
                    <div className="-mt-12 relative flex-shrink-0">
                        <div
                            className="w-28 h-28 rounded-full border-4 border-white bg-white shadow-lg relative group overflow-hidden cursor-pointer"
                            onClick={() => avatarInputRef.current?.click()}
                            title="Click to change profile picture"
                        >
                            {user.avatar ? (
                                <img
                                    src={`http://localhost:5000/${user.avatar}`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-3xl font-bold text-blue-600">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                {uploadingAvatar
                                    ? <span className="text-white text-xs font-semibold">Uploading…</span>
                                    : <>
                                        <Camera className="w-5 h-5 text-white" />
                                        <span className="text-white text-[10px] mt-1 font-medium">Change Photo</span>
                                    </>
                                }
                            </div>
                        </div>
                    </div>

                    {/* Header Info */}
                    <div className="flex-1 w-full pt-2 md:pt-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="w-full max-w-2xl">
                                {isEditing ? (
                                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-blue-100 mb-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="text-lg font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none w-full bg-white"
                                                placeholder="Your Name"
                                            />
                                            <div className="flex items-center">
                                                <MapPin className="w-4 h-4 text-gray-400 absolute ml-3" />
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={formData.location}
                                                    onChange={handleInputChange}
                                                    className="pl-9 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none w-full bg-white"
                                                    placeholder="Location"
                                                />
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            name="headline"
                                            value={formData.headline}
                                            onChange={handleInputChange}
                                            className="text-gray-700 text-sm w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white"
                                            placeholder="Headline (e.g. Aspiring Software Engineer)"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{user.name}</h1>
                                        <p className="text-gray-600 font-medium mt-0.5">{user.headline || 'Add a headline'}</p>
                                        <div className="flex items-center flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded text-gray-600"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {user.location || 'Add location'}</span>
                                            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {user.email}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 self-start md:self-auto">
                                {!isEditing && user.resume && (
                                    <button
                                        onClick={handleExtractProfile}
                                        disabled={extractingProfile}
                                        className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition shadow-sm bg-violet-100 border-2 border-violet-200 text-violet-700 hover:bg-violet-200 hover:shadow disabled:opacity-50"
                                    >
                                        {extractingProfile ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting...</> : <><Zap className="w-4 h-4 fill-current" /> Auto-fill from Resume</>}
                                    </button>
                                )}
                                <button
                                    onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition shadow-sm ${isEditing
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                                        }`}
                                >
                                    {isEditing ? 'Save Changes' : <><Edit2 className="w-3.5 h-3.5" /> Edit Profile</>}
                                </button>
                                {isEditing && (
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (Main Content) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* About Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                                About
                            </h2>
                            {!isEditing && <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition"><Edit2 className="w-4 h-4" /></button>}
                        </div>
                        {isEditing ? (
                            <textarea
                                name="about"
                                value={formData.about}
                                onChange={handleInputChange}
                                className="w-full h-32 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-gray-700 text-sm leading-relaxed bg-gray-50"
                                placeholder="Tell us about yourself..."
                            />
                        ) : (
                            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
                                {user.about || <span className="text-gray-400 italic">No description added yet. Tell recruiters about yourself!</span>}
                            </p>
                        )}
                    </div>

                    {/* Education Section - Moved to Main Column */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
                                Education
                            </h2>
                            {!isEditing && <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-purple-600 p-1 rounded-full hover:bg-purple-50 transition"><Edit2 className="w-4 h-4" /></button>}
                        </div>
                        {isEditing ? (
                            <textarea
                                name="education"
                                value={formData.education}
                                onChange={handleInputChange}
                                className="w-full h-24 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-100 focus:border-purple-500 outline-none text-gray-700 text-sm bg-gray-50"
                                placeholder="Enter your education details..."
                            />
                        ) : (
                            <div className="flex gap-4 items-start">
                                <div className="w-10 h-10 bg-purple-50 rounded-xl shrink-0 flex items-center justify-center text-purple-600">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div className="pt-1">
                                    <h3 className="font-semibold text-gray-900 text-sm">{user.education || <span className="text-gray-400 font-normal italic">Add your education history</span>}</h3>
                                    {user.education && <p className="text-purple-600 text-xs mt-1 font-medium bg-purple-50 inline-block px-2 py-0.5 rounded">Student</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (Sidebar) */}
                <div className="space-y-6">
                    {/* Resume Section - Compact */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/10 transition"></div>

                        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                            Resume
                        </h2>
                        <p className="text-gray-400 text-xs mb-4">Manage your CV for applications</p>

                        {user.resume && (
                            <div className="mb-4 bg-white/10 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-8 h-8 rounded bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate">My_Resume.pdf</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs">
                                            <Link to="/seeker/view-resume" className="text-blue-300 hover:text-blue-100 font-semibold transition">View</Link>
                                            <span className="text-gray-500">•</span>
                                            <button
                                                onClick={handleResumeDelete}
                                                disabled={deletingResume}
                                                className="text-red-400 hover:text-red-300 transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {deletingResume ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleResumeUpload}
                                className="hidden"
                                accept="application/pdf"
                            />
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="w-full bg-white text-gray-900 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-100 shadow-md flex items-center justify-center gap-2 transition transform hover:scale-[1.02]"
                            >
                                {uploading ? 'Uploading...' : (user.resume ? 'Update Resume' : 'Upload Resume')}
                            </button>
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                                Skills
                            </h2>
                            {!isEditing && <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-green-600 p-1 rounded-full hover:bg-green-50 transition"><Edit2 className="w-4 h-4" /></button>}
                        </div>

                        {isEditing ? (
                            <div>
                                <input
                                    type="text"
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-100 focus:border-green-500 outline-none text-sm bg-gray-50"
                                    placeholder="e.g. Java, Python, React"
                                />
                                <p className="text-xs text-gray-400 mt-2">Separate skills with commas</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {user.skills && Array.isArray(user.skills) && user.skills.length > 0 ? user.skills.map((skill, index) => (
                                    <span key={index} className="px-3 py-1 bg-gray-50 text-gray-700 font-medium rounded-lg text-xs border border-gray-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700 transition cursor-default">
                                        {skill}
                                    </span>
                                )) : (user.skills && typeof user.skills === 'string' ? user.skills.split(',').map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-gray-50 text-gray-700 font-medium rounded-lg text-xs border border-gray-200">
                                        {skill.trim()}
                                    </span>
                                )) : <span className="text-gray-400 text-sm italic">No skills added yet</span>)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
