const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { applyForJob, getMyApplications, getJobApplications, updateApplicationStatus, viewResume, getMyApplicants } = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure Multer with ABSOLUTE path so files always go to server/uploads/resumes/
// regardless of the process current working directory
const resumeUploadDir = path.join(__dirname, '..', 'uploads', 'resumes');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, resumeUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
    }
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

// Optional upload — works with or without a file (profile resume fallback)
const uploadOptional = (req, res, next) => {
    upload.single('resume')(req, res, (err) => {
        if (err) return next(err); // real multer errors (wrong type, too large)
        next(); // file may or may not be present — controller decides
    });
};

router.post('/', protect, authorize('Seeker'), uploadOptional, applyForJob);
router.get('/my-applications', protect, authorize('Seeker'), getMyApplications);
router.get('/my-applicants', protect, authorize('Recruiter'), getMyApplicants);
router.get('/job/:jobId', protect, authorize('Recruiter'), getJobApplications);
router.put('/:id/status', protect, authorize('Recruiter'), updateApplicationStatus);
router.get('/resume/:filename', viewResume);

module.exports = router;
