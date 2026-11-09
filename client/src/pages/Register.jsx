import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Seeker',
        headline: '',
        location: '',
        companyName: '',
    });

    const { name, email, password, confirmPassword, role, headline, location, companyName } = formData;
    const navigate = useNavigate();

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        const userData = {
            name,
            email,
            password,
            role,
            headline,
            location,
            companyName,
        };

        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', userData);
            if (response.data) {
                localStorage.setItem('user', JSON.stringify(response.data));
                toast.success('Registration Successful!');
                if (response.data.role === 'Recruiter') {
                    navigate('/recruiter');
                } else {
                    navigate('/seeker/home');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
            <div className="flex w-full max-w-5xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl shadow-blue-100/50 ring-1 ring-gray-100">
                {/* Left Side - Form */}
                <div className="flex w-full flex-col justify-center p-8 md:w-1/2 md:p-14 lg:p-20">
                    <div className="mb-6">
                        <h2 className="text-3xl font-extrabold text-gray-900">JobLink</h2>
                    </div>

                    <div className="mb-4">
                        <h1 className="mb-2 text-2xl font-bold text-gray-900">Create Account</h1>
                        <p className="text-sm text-gray-500">Join us and find your dream job today</p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={name}
                                    onChange={onChange}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Full Name"
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={location}
                                    onChange={onChange}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="e.g. New York, USA"
                                />
                            </div>
                        </div>

                        <div>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Email Address"
                                required
                            />
                        </div>

                        <div>
                            <input
                                type="text"
                                id="headline"
                                name="headline"
                                value={headline}
                                onChange={onChange}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder={role === 'Recruiter' ? "Job Title (e.g. HR Manager)" : "Professional Headline (e.g. Software Engineer)"}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Password"
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={onChange}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Confirm Password"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">I am a...</label>
                            <select
                                id="role"
                                name="role"
                                value={role}
                                onChange={onChange}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="Seeker">Job Seeker</option>
                                <option value="Recruiter">Recruiter</option>
                            </select>
                        </div>

                        {role === 'Recruiter' && (
                            <div>
                                <input
                                    type="text"
                                    id="companyName"
                                    name="companyName"
                                    value={companyName}
                                    onChange={onChange}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Company Name"
                                    required={role === 'Recruiter'}
                                />
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Sign Up
                            </button>
                        </div>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500">
                            Sign In
                        </Link>
                    </p>
                </div>

                {/* Right Side - Image/Illustration */}
                <div className="hidden w-1/2 bg-white md:block">
                    <div className="flex h-full w-full items-center justify-center p-8">
                        <img
                            src="https://img.freepik.com/free-vector/user-verification-unauthorized-access-prevention-private-account-authentication-cyber-security-people-entering-login-password-safety-measures_335657-1592.jpg?semt=ais_user_personalization&w=740&q=80"
                            alt="Register Illustration"
                            className="h-full w-full object-contain"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none'; // Hide if fails
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
