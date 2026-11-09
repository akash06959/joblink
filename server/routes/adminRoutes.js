const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getAllUsers,
    deleteUser,
    getAllJobs,
    deleteJob
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected and require 'Admin' role
router.use(protect);
router.use(authorize('Admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/jobs', getAllJobs);
router.delete('/jobs/:id', deleteJob);

module.exports = router;
