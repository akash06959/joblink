import { useNavigate } from 'react-router-dom';
import { Briefcase, Award, Layers, Monitor, BookOpen, ChevronRight, TrendingUp, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const Home = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [featuredJobs, setFeaturedJobs] = useState([]);

    const categories = [
        { label: 'Internships', icon: Layers, color: 'text-orange-500', bg: 'bg-orange-50', path: '/seeker/jobs?type=internship' },
        { label: 'Jobs', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50', path: '/seeker/jobs' },
        { label: 'Competitions', icon: Award, color: 'text-yellow-500', bg: 'bg-yellow-50', path: '/seeker/competitions' },
        { label: 'Mentorships', icon: BookOpen, color: 'text-green-500', bg: 'bg-green-50', path: '/seeker/mentorship' },
    ];

    // Colors for the featured cards to rotate through
    const cardColors = [
        'bg-gradient-to-br from-blue-600 to-indigo-800',
        'bg-gradient-to-br from-purple-600 to-pink-600',
        'bg-gradient-to-br from-orange-500 to-red-600',
        'bg-gradient-to-br from-green-600 to-teal-700'
    ];

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // Fetch basic jobs list
                // Note: In a real app, you might have a specific endpoint for 'featured' jobs
                const { data } = await axios.get('http://localhost:5000/api/jobs');
                // Taking the first 4 jobs as "Featured" for now
                setFeaturedJobs(data.slice(0, 4));
            } catch (error) {
                console.error("Error fetching jobs", error);
            }
        };

        if (user.token) {
            fetchJobs();
        }
    }, []);

    const scrollToDashboard = () => {
        const element = document.getElementById('dashboard-content');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="font-sans max-w-7xl mx-auto px-6 lg:px-12">
            {/* ------------------- HERO LANDING SECTION ------------------- */}
            <div className="min-h-[85vh] flex flex-col md:flex-row items-center justify-between gap-12 mb-20">
                {/* Left Text Content */}
                <div className="flex-1 space-y-8 animate-fade-in-up">
                    <h1 className="text-5xl md:text-7xl font-serif text-gray-900 leading-tight">
                        Forget everything <br />
                        you know about <br />
                        <span className="text-blue-600 italic">job hunting.</span>
                    </h1>
                    <p className="text-xl text-gray-500 max-w-lg leading-relaxed">
                        Instant matches. Incredible opportunities. Big dreams.
                        <br />
                        Experience the future of career growth today.
                    </p>
                    <button
                        onClick={scrollToDashboard}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-bold px-10 py-4 rounded-full shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-1"
                    >
                        GET STARTED
                    </button>


                </div>

                {/* Right Illustration Placeholder */}
                <div className="flex-1 flex justify-center items-center w-full max-w-lg relative">
                    {/* Abstract Shapes resembling the Lemonade art style */}
                    <div className="relative w-full aspect-square md:w-[500px] md:h-[500px]">
                        {/* Circle Background */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-50 rounded-full z-0"></div>

                        {/* Main Hero Image */}
                        <div className="absolute inset-0 z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white transform rotate-3 hover:rotate-0 transition-all duration-700 ease-in-out">
                            <img
                                src="https://www.theforage.com/blog/wp-content/uploads/2022/07/ProfessionalServicesCareer.jpg"
                                alt="Professional Career"
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay Gradient for better text contrast if needed, or just aesthetic */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>

                        {/* Floating Cards Animation */}
                        <div className="absolute top-20 -right-4 w-40 p-4 bg-white rounded-xl shadow-xl z-20 animate-bounce delay-700 border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">$</div>
                                <div className="h-2 w-16 bg-gray-100 rounded-full"></div>
                            </div>
                            <div className="h-2 w-24 bg-gray-100 rounded-full"></div>
                        </div>

                        <div className="absolute bottom-20 -left-8 w-48 p-4 bg-white rounded-xl shadow-xl z-20 animate-pulse border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="h-3 w-20 bg-gray-200 rounded-full mb-1"></div>
                                    <div className="h-2 w-12 bg-gray-100 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="flex justify-center mb-16 animate-bounce">
                <button onClick={scrollToDashboard} className="text-gray-400 hover:text-blue-600 transition-colors flex flex-col items-center gap-2 text-sm">
                    Scroll for more
                    <TrendingUp className="w-5 h-5 rotate-180" />
                </button>
            </div>


            {/* ------------------- EXISTING DASHBOARD CONTENT ------------------- */}
            <div id="dashboard-content" className="pt-10 scroll-mt-20">
                {/* HERO TEXT (Reduced size since we have a main hero now) */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Explore <span className="text-blue-600">Categories</span>
                    </h2>
                    <p className="text-gray-500">Find the perfect opportunity for your skills.</p>
                </div>

                {/* CATEGORY TILES SCROLL */}
                <div className="flex gap-4 overflow-x-auto pb-6 mb-16 no-scrollbar justify-center flex-wrap">
                    {categories.map((cat) => (
                        <div
                            key={cat.label}
                            onClick={() => navigate(cat.path)}
                            className={`min-w-[120px] w-[140px] h-[140px] rounded-3xl ${cat.bg} border border-white shadow-sm hover:shadow-md cursor-pointer transition-transform hover:-translate-y-1 flex flex-col items-center justify-center gap-3 group`}
                        >
                            <div className={`p-3 bg-white rounded-full shadow-sm ${cat.color}`}>
                                <cat.icon className="w-8 h-8" />
                            </div>
                            <span className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{cat.label}</span>
                        </div>
                    ))}
                </div>

                {/* FEATURED SECTION */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6 border-l-4 border-blue-600 pl-3">
                        <h2 className="text-2xl font-bold text-gray-800">Featured Opportunities</h2>
                    </div>

                    {featuredJobs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {featuredJobs.map((job, index) => (
                                <div
                                    key={job.id}
                                    onClick={() => navigate('/seeker/jobs')}
                                    className={`rounded-2xl p-6 h-[320px] ${cardColors[index % cardColors.length]} text-white relative overflow-hidden cursor-pointer hover:shadow-xl transition-shadow flex flex-col justify-end group`}
                                >
                                    {/* Decorative Background Elements */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500"></div>

                                    <div className="relative z-10">
                                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm mb-3 inline-block">
                                            {job.type || 'Full-time'}
                                        </span>
                                        <h3 className="text-2xl font-bold mb-1 leading-tight line-clamp-2">{job.title}</h3>
                                        <p className="text-white/90 text-sm font-medium mb-1">{job.company}</p>
                                        <p className="text-white/70 text-xs mb-4 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {job.location}
                                        </p>

                                        <button className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-bold w-full hover:bg-gray-100 transition-colors">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                            <p className="text-gray-500">No featured opportunities available right now.</p>
                            <button onClick={() => navigate('/recruiter/post-job')} className="mt-2 text-blue-600 font-medium hover:underline text-sm">
                                (Recruiters: Post a job to see it here)
                            </button>
                        </div>
                    )}
                </div>

                {/* RECENTLY ADDED / RECOMMENDED */}
                <div className='pb-20'>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 border-l-4 border-orange-500 pl-3">
                            <h2 className="text-2xl font-bold text-gray-800">Recommended for You</h2>
                        </div>
                        <button onClick={() => navigate('/seeker/jobs')} className="text-blue-600 font-semibold flex items-center hover:underline">
                            View All <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                        <TrendingUp className="w-12 h-12 text-blue-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Build your profile to get matched!</h3>
                        <p className="text-gray-500 mb-6 max-w-lg mx-auto">Complete your profile with skills and experience to see personalized job recommendations here.</p>
                        <button onClick={() => navigate('/seeker/profile')} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition">
                            Update Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;


