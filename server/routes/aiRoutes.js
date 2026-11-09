const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeResumeController } = require('../controllers/ai/aiController');
const { smartMatchResume } = require('../controllers/ai/smartMatchController');
const { atsCheckForJob } = require('../controllers/ai/atsCheckController');
// const { protect } = require('../middleware/authMiddleware');

// Configure Multer for PDF Uploads
const upload = multer({
    dest: 'uploads/resumes/', // Temporary storage
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
});

// Routes
router.post('/analyze-resume', upload.single('resume'), analyzeResumeController);
router.post('/smart-match', upload.single('resume'), smartMatchResume);
router.post('/ats-check/:jobId', upload.single('resume'), atsCheckForJob);

module.exports = router;
