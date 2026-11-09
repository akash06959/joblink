const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    registerUser,
    loginUser,
    googleLogin,
    getMe,
    uploadResume,
    updateUserProfile,
    uploadAvatar,
    deleteResume,
    extractAutoFillData,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Configure Multer with Storage to preserve extension
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/resumes/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '.pdf');
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
});

/* ── Avatar (profile picture) multer ── */
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `avatar-${req.user?.id || Date.now()}-${Date.now()}${ext}`);
    },
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
});

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);
router.post('/extract-profile', protect, extractAutoFillData);
router.post('/resume', protect, upload.single('resume'), uploadResume);
router.delete('/resume', protect, deleteResume);
router.post('/avatar', protect, avatarUpload.single('avatar'), uploadAvatar);

module.exports = router;
