import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Onboarding = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        role: 'Seeker',
        headline: '',
        location: '',
        companyName: '',
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const { role, headline, location, companyName } = formData;

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        if (!user) return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const updateData = {
                role, // Only update allowed fields
                headline,
                location,
                companyName: role === 'Recruiter' ? companyName : undefined,
            };

            // We need a specific endpoint to update profile, reusing the existing one
            // Note: The existing updateUserProfile might need 'name', 'email' etc to be preserved if we just send partial data
            // Let's assume the backend handles partial updates well or we send existing data if needed.
            // Looking at authController: user.update uses specific fields from req.body (name, headline, etc).
            // It does NOT update role currently. WE NEED TO FIX BACKEND TO ALLOW ROLE UPDATE if that's the intention here.

            // Wait, we need to update User role! The existing updateProfile might not allow role update for security.
            // Let's add a specific 'onboarding' logic or update the profile route to allow role change if it's currently 'Seeker' (default)
            // For now, let's try updating via the profile route.

            // Ideally we need to extend updateUserProfile to accept 'role' and 'companyName'.
            // I will update the backend controller in the next step to allow role update for onboarding.

            const res = await axios.put('http://localhost:5000/api/auth/profile', updateData, config);

            if (res.data) {
                // Update local storage with new details
                const updatedUser = { ...user, ...res.data };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                toast.success('Setup Complete!');
                if (updatedUser.role === 'Recruiter') {
                    navigate('/recruiter');
                } else {
                    navigate('/seeker/home');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
                <div className="mb-6 text-center">
                    <h2 className="text-3xl font-bold text-gray-900">Welcome!</h2>
                    <p className="mt-2 text-gray-600">Let's finish setting up your profile.</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">I am a...</label>
                        <select
                            name="role"
                            value={role}
                            onChange={onChange}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="Seeker">Job Seeker</option>
                            <option value="Recruiter">Recruiter</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                            {role === 'Recruiter' ? 'Job Title' : 'Professional Headline'}
                        </label>
                        <input
                            type="text"
                            name="headline"
                            value={headline}
                            onChange={onChange}
                            placeholder={role === 'Recruiter' ? "e.g. HR Manager" : "e.g. Software Engineer"}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">Location</label>
                        <input
                            type="text"
                            name="location"
                            value={location}
                            onChange={onChange}
                            placeholder="e.g. New York, USA"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {role === 'Recruiter' && (
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Company Name</label>
                            <input
                                type="text"
                                name="companyName"
                                value={companyName}
                                onChange={onChange}
                                placeholder="e.g. Acme Corp"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required={role === 'Recruiter'}
                            />
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Complete Setup
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Onboarding;
