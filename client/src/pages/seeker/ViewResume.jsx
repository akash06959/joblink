import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ViewResume = () => {
    const navigate = useNavigate();
    const [resumeUrl, setResumeUrl] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.resume) {
            setResumeUrl(`http://localhost:5000/${user.resume}`);
        } else {
            // Redirect if no resume
            navigate('/seeker/profile');
        }
    }, [navigate]);

    if (!resumeUrl) return <div className="text-center py-10">Loading Resume...</div>;

    return (
        <div className="flex flex-col h-[80vh] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h1 className="text-lg font-bold text-gray-800">My Resume</h1>
                <a
                    href={resumeUrl}
                    download
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    Download PDF
                </a>
            </div>
            <div className="flex-1 bg-gray-100">
                <iframe
                    src={resumeUrl}
                    className="w-full h-full"
                    title="Resume Viewer"
                />
            </div>
        </div>
    );
};

export default ViewResume;
