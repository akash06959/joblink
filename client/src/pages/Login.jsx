import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const { email, password } = formData;
    const navigate = useNavigate();

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/google', {
                tokenId: credentialResponse.credential,
            });

            if (res.data) {
                localStorage.setItem('user', JSON.stringify(res.data));
                toast.success('Google Login Successful!');
                if (res.data.isNewUser) {
                    navigate('/onboarding');
                } else if (res.data.role === 'Admin') {
                    navigate('/admin');
                } else if (res.data.role === 'Recruiter') {
                    navigate('/recruiter');
                } else {
                    navigate('/seeker/home');
                }
            }
        } catch (error) {
            console.error('Google Login Error:', error);
            toast.error('Google Login Failed');
        }
    };

    const handleGoogleFailure = () => {
        console.error('Google Login Failed');
        toast.error('Google Login Failed');
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        const userData = {
            email,
            password,
        };

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', userData);
            if (response.data) {
                localStorage.setItem('user', JSON.stringify(response.data));
                toast.success('Login Successful!');
                if (response.data.role === 'Admin') {
                    navigate('/admin');
                } else if (response.data.role === 'Recruiter') {
                    navigate('/recruiter');
                } else {
                    navigate('/seeker/home');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
            <div className="flex w-full max-w-5xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl shadow-blue-100/50 ring-1 ring-gray-100">
                {/* Left Side - Form */}
                <div className="flex w-full flex-col justify-center p-8 md:w-1/2 md:p-14 lg:p-20">
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-gray-900">JobLink</h2>
                    </div>

                    <div className="mb-6">
                        <h1 className="mb-2 text-3xl font-bold text-gray-900">Holla, Welcome Back</h1>
                        <p className="text-sm text-gray-500">Hey, welcome back to your special place</p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                id="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Email or Username"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="••••••••••••"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500">
                                    Remember me
                                </label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="font-medium text-gray-400 hover:text-blue-500">
                                    Forgot Password?
                                </a>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-40 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Sign In
                            </button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">Or continue with</span>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleFailure}
                            />
                        </div>
                    </div>

                    <p className="mt-8 text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-bold text-blue-600 hover:text-blue-500">
                            Sign Up
                        </Link>
                    </p>
                </div>

                {/* Right Side - Image/Illustration */}
                <div className="hidden w-1/2 bg-white md:block">
                    <div className="flex h-full w-full items-center justify-center p-8">
                        <img
                            src="https://img.freepik.com/free-vector/access-control-system-abstract-concept_335657-3180.jpg?semt=ais_user_personalization&w=740&q=80"
                            alt="Secure Login Illustration"
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

export default Login;
