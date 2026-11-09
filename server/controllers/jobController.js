const asyncHandler = require('express-async-handler');
const Job = require('../models/Job');

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (Recruiter only)
const createJob = asyncHandler(async (req, res) => {
    const { title, description, company, location, requirements, responsibilities, salary, type, workMode, experienceLevel, industry, applicationDeadline, benefits } = req.body;

    if (!title || !description || !company || !location) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    const job = await Job.create({
        recruiterId: req.user.id,
        title,
        description,
        company,
        location,
        requirements,
        responsibilities,
        salary,
        type,
        workMode,
        experienceLevel,
        industry,
        applicationDeadline,
        benefits,
    });

    res.status(201).json(job);
});

// @desc    Get current recruiter's jobs
// @route   GET /api/jobs/my-jobs
// @access  Private (Recruiter only)
const getRecruiterJobs = asyncHandler(async (req, res) => {
    const jobs = await Job.findAll({
        where: { recruiterId: req.user.id },
        order: [['createdAt', 'DESC']]
    });
    res.json(jobs);
});

// @desc    Get all active jobs (for Seekers)
// @route   GET /api/jobs
// @access  Public (or Private)
const getAllJobs = asyncHandler(async (req, res) => {
    const jobs = await Job.findAll({
        order: [['createdAt', 'DESC']]
    });
    res.json(jobs);
});

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = asyncHandler(async (req, res) => {
    const job = await Job.findByPk(req.params.id);

    if (job) {
        res.json(job);
    } else {
        res.status(404);
        throw new Error('Job not found');
    }
});

const smartFilterJobs = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Resume file is required');
    }

    const { extractTextFromPDF, extractSkills } = require('../utils/aiService');

    // 1. Extract Text
    const resumeText = await extractTextFromPDF(req.file.path);

    // 2. Extract Skills using AI
    const skills = await extractSkills(resumeText);

    if (!skills || skills.length === 0) {
        return res.json({ jobs: [], skills: [] });
    }

    // 3. Search Jobs in DB matching skills
    // We will do a simple OR query for now

    const { pool } = require('../db');

    // Dynamically build query: SELECT * FROM "Jobs" WHERE description ILIKE '%Skill1%' OR description ILIKE '%Skill2%'...
    const conditions = skills.map((_, index) => `("description" ILIKE $${index + 1} OR "title" ILIKE $${index + 1})`);
    const query = `
        SELECT * FROM "Jobs" 
        WHERE ${conditions.join(' OR ')}
        ORDER BY "createdAt" DESC
        LIMIT 20
    `;

    const values = skills.map(skill => `%${skill}%`);

    const result = await pool.query(query, values);

    // Return both matched jobs and the skills extracted (so user knows what was found)
    res.json({
        skills,
        jobs: result.rows
    });
});

// @desc    Get recruiter dashboard stats
// @route   GET /api/jobs/stats
// @access  Private (Recruiter only)
const getRecruiterStats = asyncHandler(async (req, res) => {
    const { pool } = require('../db');
    const recruiterId = req.user.id;

    // Count jobs
    const jobCountRes = await pool.query(
        'SELECT COUNT(*) FROM "Jobs" WHERE "recruiterId" = $1',
        [recruiterId]
    );
    const totalJobs = parseInt(jobCountRes.rows[0].count);

    // Count applications for my jobs
    const appCountRes = await pool.query(
        `SELECT COUNT(*) FROM "Applications" a
         JOIN "Jobs" j ON a."jobId" = j.id
         WHERE j."recruiterId" = $1`,
        [recruiterId]
    );
    const totalApplications = parseInt(appCountRes.rows[0].count);

    // Get recent applications (limit 5)
    // We need to join with Users to get applicant name
    const recentAppsRes = await pool.query(
        `SELECT a.id, a.status, a."createdAt", j.title as "jobTitle", u.name as "applicantName"
         FROM "Applications" a
         JOIN "Jobs" j ON a."jobId" = j.id
         JOIN "Users" u ON a."applicantId" = u.id
         WHERE j."recruiterId" = $1
         ORDER BY a."createdAt" DESC
         LIMIT 5`,
        [recruiterId]
    );

    res.json({
        totalJobs,
        totalApplications,
        recentApplications: recentAppsRes.rows
    });
});

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private (Recruiter only)
const updateJob = asyncHandler(async (req, res) => {
    const job = await Job.findByPk(req.params.id);

    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    // Check ownership
    if (job.recruiterId !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedJob = await job.update(req.body);
    res.json(updatedJob);
});

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private (Recruiter only)
const deleteJob = asyncHandler(async (req, res) => {
    const job = await Job.findByPk(req.params.id);

    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    // Check ownership
    if (job.recruiterId !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await Job.delete(req.params.id);
    res.json({ id: req.params.id });
});

module.exports = {
    createJob,
    getRecruiterJobs,
    getAllJobs,
    getJobById,
    smartFilterJobs,
    getRecruiterStats,
    updateJob,
    deleteJob
};
