import { Star, MessageCircle, Video, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Mentorship = () => {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMentors = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/jobs');
                const mentorData = data.filter(job => job.type === 'Mentorship');
                setMentors(mentorData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching mentorships", error);
                setLoading(false);
            }
        };

        fetchMentors();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading mentors...</div>;

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Mentorship Sessions</h1>
                <p className="text-gray-500 text-sm mt-1">Connect with industry experts and accelerate your career.</p>
            </div>

            {mentors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mentors.map((mentor) => (
                        <div key={mentor.id} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center text-center hover:shadow-lg transition-all h-full">
                            <div className="relative mb-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-xl font-bold text-gray-400">
                                    {mentor.company.charAt(0)}
                                </div>
                                <div className={`absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-white`}>
                                    {mentor.company.charAt(0)}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{mentor.title}</h3>
                            <p className="text-sm text-gray-600 mb-1">{mentor.company}</p>
                            <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Available Now
                            </p>

                            <div className="flex flex-wrap justify-center gap-1.5 mb-6 flex-1">
                                {mentor.requirements && mentor.requirements.slice(0, 3).map(skill => (
                                    <span key={skill} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center justify-between w-full pt-4 border-t border-gray-100 mb-4 text-xs text-gray-500 font-medium">
                                <div className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                    New
                                </div>
                                <div className="flex items-center gap-1">
                                    <Video className="w-3.5 h-3.5" />
                                    1:1 Session
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(`/seeker/jobs/${mentor.id}`)}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Book Session
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Video className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No mentors available</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        There are no mentorship sessions available right now. New mentors join every week!
                    </p>
                </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex items-center justify-center gap-3 mt-6">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-800 font-medium">More mentors join every week! check back soon.</span>
            </div>
        </div>
    );
};

export default Mentorship;
