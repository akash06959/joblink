const express = require('express');
const router = express.Router();
const { createJob, getRecruiterJobs, getAllJobs, getJobById, smartFilterJobs, getRecruiterStats, updateJob, deleteJob } = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');

// Reusing similar multer config (simple)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/resumes/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'smart-filter-' + uniqueSuffix + '.pdf');
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/', getAllJobs);

// Specific routes MUST come before parameterized routes (/:id)
router.get('/stats', protect, authorize('Recruiter'), getRecruiterStats);
router.get('/my-jobs', protect, authorize('Recruiter'), getRecruiterJobs);

router.post('/smart-filter', upload.single('resume'), smartFilterJobs);
router.post('/', protect, authorize('Recruiter'), createJob);

// Parameterized routes
router.get('/:id', getJobById);
router.put('/:id', protect, authorize('Recruiter'), updateJob);
router.delete('/:id', protect, authorize('Recruiter'), deleteJob);

module.exports = router;
