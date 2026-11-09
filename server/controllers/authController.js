const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, headline, location, companyName } = req.body;
    console.log(`Register request for: ${email}`);

    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
        headline,
        location,
        companyName,
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Login user / Authenticate user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email: identifier, password } = req.body;

    console.log(`Login attempt for: ${identifier}`);

    // Try by email first; if that misses, try by name (username)
    let user = await User.findOne({ where: { email: identifier } });
    if (!user) {
        user = await User.findOne({ where: { name: identifier } });
    }

    if (user) {
        console.log(`User found: ${user.email}, ID: ${user.id}`);
    } else {
        console.log('User not found by email or name');
    }

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email/username or password');
    }
});

// @desc    Google Login
// @route   POST /api/auth/google
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
    const { tokenId } = req.body; // Actually credential from FE

    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, sub: googleId, picture } = ticket.getPayload();
        console.log(`Google Login for: ${email}, Google ID: ${googleId}`);

        let user = await User.findOne({ where: { googleId } });

        if (!user) {
            // Fallback to check by email if no googleId found
            user = await User.findOne({ where: { email } });
            if (user) {
                // Link the accounts?
                // For now, let's just log them in, maybe update their googleId in a future improvement.
                // Ideally update user with googleId here.
                // user.update({ googleId }); // Need to implement update with googleId in User model if we want this
                console.log(`User found by email: ${email}. Logging in.`);
            }
        }

        if (user) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id),
            });
        } else {
            // Register new user
            // Generate a random password since they are using Google
            const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            user = await User.create({
                name,
                email,
                password,
                role: 'Seeker', // Default, will change in onboarding
                googleId,
            });

            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id),
                isNewUser: true, // Flag for frontend redirection
            });
        }

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401);
        throw new Error('Google authentication failed');
    }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);

    res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        headline: user.headline,
        location: user.location,
        resume: user.resume,
        about: user.about,
        skills: user.skills,
        education: user.education,
        avatar: user.avatar || null,
    });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (user) {
        let updatedSkills = req.body.skills;
        if (typeof updatedSkills === 'string') {
            updatedSkills = updatedSkills.split(',').map(s => s.trim()).filter(Boolean);
        }

        const updatedUser = await user.update({
            name: req.body.name || user.name, // Keep existing if not provided
            headline: req.body.headline,
            location: req.body.location,
            about: req.body.about,
            skills: updatedSkills,
            education: req.body.education,
            role: req.body.role || user.role, // Allow role update if provided (for onboarding)
            companyName: req.body.companyName,
        });

        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            headline: updatedUser.headline,
            location: updatedUser.location,
            resume: updatedUser.resume,
            about: updatedUser.about,
            skills: updatedUser.skills,
            education: updatedUser.education,
            avatar: updatedUser.avatar || null,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Upload profile avatar
// @route   POST /api/auth/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload an image file');
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Store path as a web-accessible URL
    const avatarPath = req.file.path.replace(/\\/g, '/');
    const updatedUser = await user.update({ avatar: avatarPath });

    res.json({
        _id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
    });
});

// @desc    Upload user resume
// @route   POST /api/auth/resume
// @access  Private
const uploadResume = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    const { extractTextFromPDF, extractSkills } = require('../utils/aiService');
    const user = await User.findByPk(req.user.id);

    if (user) {
        const resumePath = req.file.path.replace(/\\/g, '/');

        // Extract skills from resume
        let extractedSkillsText = '';
        try {
            const resumeText = await extractTextFromPDF(req.file.path);
            if (resumeText) {
                const skillsArray = await extractSkills(resumeText);
                if (skillsArray && Array.isArray(skillsArray) && skillsArray.length > 0) {
                    extractedSkillsText = skillsArray.join(', ');
                }
            }
        } catch (err) {
            console.error('Error extracting skills from resume:', err.message);
        }

        const updateData = { resume: resumePath };

        // Only update skills if we successfully extracted some, and user either doesn't have any,
        // or we just want to update it. Let's merge them or just update it.
        if (extractedSkillsText) {
            let existingSkills = [];
            if (Array.isArray(user.skills)) {
                existingSkills = user.skills;
            } else if (typeof user.skills === 'string') {
                existingSkills = user.skills.split(',').map(s => s.trim()).filter(Boolean);
            }
            const newSkills = extractedSkillsText.split(',').map(s => s.trim()).filter(Boolean);
            updateData.skills = Array.from(new Set([...existingSkills, ...newSkills]));
        }

        const updatedUser = await user.update(updateData);

        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            resume: updatedUser.resume,
            skills: updatedUser.skills,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete user resume
// @route   DELETE /api/auth/resume
// @access  Private
const deleteResume = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (user) {
        // Optionally, delete the actual file from the file system.
        // We'll skip for now if we want to retain past applications' references to it,
        // or we can remove it if we strictly want it gone.
        // For now, we'll just remove the path from the user's profile.

        const updatedUser = await user.update({
            resume: null,
        });

        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            resume: updatedUser.resume,
            skills: updatedUser.skills,
        });
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Extract Auto-Fill Data from Resume
// @route   POST /api/auth/extract-profile
// @access  Private
const extractAutoFillData = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (!user || !user.resume) {
        res.status(400);
        throw new Error('No resume found on your profile. Please upload one first.');
    }

    const { extractTextFromPDF, extractProfileDetails } = require('../utils/aiService');

    try {
        const resumeText = await extractTextFromPDF(user.resume);
        if (!resumeText) {
            res.status(400);
            throw new Error('Could not extract text from the uploaded PDF document.');
        }

        const profileData = await extractProfileDetails(resumeText);

        // Return the extracted data to the frontend so they can fill the form
        res.json({
            about: profileData.about || '',
            skills: profileData.skills || [],
            education: profileData.education || '',
        });
    } catch (error) {
        console.error('Error in extractAutoFillData:', error);
        res.status(500);
        // Bubble up specific API error instead of hiding it
        throw new Error(error.message || 'Failed to auto-extract profile details from resume.');
    }
});

module.exports = {
    registerUser,
    loginUser,
    googleLogin,
    getMe,
    uploadResume,
    updateUserProfile,
    uploadAvatar,
    deleteResume,
    extractAutoFillData,
};
