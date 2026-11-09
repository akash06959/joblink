import { Award, Calendar, Users, ArrowRight, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Competitions = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/jobs');
                const compData = data.filter(job => job.type === 'Competition');
                setCompetitions(compData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching competitions", error);
                setLoading(false);
            }
        };

        fetchCompetitions();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading challenges...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Competitions & Challenges</h1>
                    <p className="text-gray-500 text-sm mt-1">Participate, compete, and showcase your skills.</p>
                </div>
            </div>

            {competitions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {competitions.map((comp) => (
                        <div key={comp.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all group flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
                                    <Award className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Active
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                                {comp.title}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">{comp.company}</p>

                            <div className="flex flex-wrap gap-2 mb-4 flex-1">
                                {comp.requirements && comp.requirements.slice(0, 3).map(tag => (
                                    <span key={tag} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-100">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-1 text-gray-500 text-xs">
                                    <MapPin className="w-4 h-4" />
                                    {comp.location}
                                </div>
                                <button
                                    onClick={() => navigate(`/seeker/jobs/${comp.id}`)}
                                    className="text-blue-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
                                >
                                    View Details <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No active competitions</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        There are no competitions or challenges live right now. Check back later!
                    </p>
                </div>
            )}
        </div>
    );
};

export default Competitions;
