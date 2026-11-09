const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { pool } = require('../db');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
    try {
        const userCountRes = await pool.query('SELECT COUNT(*) FROM "Users"');
        const seekerCountRes = await pool.query('SELECT COUNT(*) FROM "Users" WHERE role = $1', ['Seeker']);
        const recruiterCountRes = await pool.query('SELECT COUNT(*) FROM "Users" WHERE role = $1', ['Recruiter']);

        const jobCountRes = await pool.query('SELECT COUNT(*) FROM "Jobs"');
        const activeJobCountRes = await pool.query('SELECT COUNT(*) FROM "Jobs" WHERE status = $1', ['Active']);

        const appCountRes = await pool.query('SELECT COUNT(*) FROM "Applications"');

        // Recent Activity (last 5 users)
        const recentUsersRes = await pool.query('SELECT id, name, email, role, "createdAt" FROM "Users" ORDER BY "createdAt" DESC LIMIT 5');

        res.json({
            counts: {
                totalUsers: parseInt(userCountRes.rows[0].count),
                totalSeekers: parseInt(seekerCountRes.rows[0].count),
                totalRecruiters: parseInt(recruiterCountRes.rows[0].count),
                totalJobs: parseInt(jobCountRes.rows[0].count),
                activeJobs: parseInt(activeJobCountRes.rows[0].count),
                totalApplications: parseInt(appCountRes.rows[0].count)
            },
            recentUsers: recentUsersRes.rows
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500);
        throw new Error('Server Error fetching stats');
    }
});

// @desc    Get All Users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT id, name, email, role, "createdAt" FROM "Users" ORDER BY "createdAt" DESC');
    res.json(result.rows);
});

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const id = req.params.id;

    // Check if user exists
    const userExist = await pool.query('SELECT * FROM "Users" WHERE id = $1', [id]);
    if (userExist.rows.length === 0) {
        res.status(404);
        throw new Error('User not found');
    }

    // Delete related data first (Manual Cascade)
    await pool.query('DELETE FROM "Applications" WHERE "applicantId" = $1', [id]);
    await pool.query('DELETE FROM "Jobs" WHERE "recruiterId" = $1', [id]); // Or handle jobs differently
    await pool.query('DELETE FROM "Notifications" WHERE "userId" = $1', [id]);

    // Delete user
    await pool.query('DELETE FROM "Users" WHERE id = $1', [id]);

    res.json({ message: 'User removed' });
});

// @desc    Get All Jobs (Admin View)
// @route   GET /api/admin/jobs
// @access  Private/Admin
const getAllJobs = asyncHandler(async (req, res) => {
    const query = `
        SELECT j.*, u.name as "recruiterName", u."companyName" 
        FROM "Jobs" j 
        LEFT JOIN "Users" u ON j."recruiterId" = u.id 
        ORDER BY j."createdAt" DESC
    `;
    const result = await pool.query(query);

    // Map to expected structure if frontend expects nested recruiter object, or update frontend to read flattened fields
    // Frontend expects: job.recruiter.name. 
    // Let's map it.
    const jobs = result.rows.map(job => ({
        ...job,
        recruiter: {
            name: job.recruiterName,
            companyName: job.companyName
        }
    }));

    res.json(jobs);
});

// @desc    Delete Job
// @route   DELETE /api/admin/jobs/:id
// @access  Private/Admin
const deleteJob = asyncHandler(async (req, res) => {
    const id = req.params.id;

    const jobExist = await pool.query('SELECT * FROM "Jobs" WHERE id = $1', [id]);
    if (jobExist.rows.length === 0) {
        res.status(404);
        throw new Error('Job not found');
    }

    // Delete related applications
    await pool.query('DELETE FROM "Applications" WHERE "jobId" = $1', [id]);

    // Delete job
    await pool.query('DELETE FROM "Jobs" WHERE id = $1', [id]);

    res.json({ message: 'Job removed' });
});

module.exports = {
    getDashboardStats,
    getAllUsers,
    deleteUser,
    getAllJobs,
    deleteJob
};
