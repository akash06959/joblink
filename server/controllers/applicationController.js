const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const Job = require('../models/Job'); // Optional, if we want to verify job exists or get its description for AI later
const { extractTextFromPDF } = require('../utils/aiService');
const Notification = require('../models/Notification');
const path = require('path');
const fs = require('fs');

// @desc    Apply for a job (upload new PDF or use profile resume)
// @route   POST /api/applications
// @access  Private (Seeker)
const applyForJob = asyncHandler(async (req, res) => {
    const { jobId, useProfileResume } = req.body;
    const applicantId = req.user.id;
    const resumeFile = req.file;

    console.log('\n=== APPLY FOR JOB ===');
    console.log('jobId:', jobId, '| useProfileResume:', useProfileResume, '| file:', resumeFile?.originalname || 'none');

    if (!jobId) {
        res.status(400);
        throw new Error('Job ID is required');
    }

    const { analyzeResume } = require('../utils/aiService');
    const { pool } = require('../db');

    // Determine resume path and verify skills
    let resumePath = null;
    let userHasSkills = false;

    // We must fetch user skills to ensure they have them updated
    const userRow = await pool.query('SELECT resume, skills FROM "Users" WHERE id = $1', [applicantId]);
    const userData = userRow.rows[0];

    const jobData = await Job.findByPk(parseInt(jobId));
    if (!jobData) {
        res.status(404);
        throw new Error('Job not found');
    }
    console.log('Job found:', jobData.title, '| Type:', jobData.type);

    const hasSkills = userData?.skills && (
        (typeof userData.skills === 'string' && userData.skills.trim() !== '') ||
        (Array.isArray(userData.skills) && userData.skills.length > 0)
    );

    if (!hasSkills && jobData.type !== 'Competition' && jobData.type !== 'Mentorship') {
        res.status(400);
        throw new Error('You cannot apply for a job without your skills updated. Please update your skills in your Profile or upload a new resume there.');
    }

    if (jobData.type === 'Competition' || jobData.type === 'Mentorship') {
        if (resumeFile) {
            resumePath = resumeFile.path;
        } else if (useProfileResume === 'true' || useProfileResume === true) {
            resumePath = userData?.resume || null;
        }
        // Resume optional for these types
        if (!resumePath) {
            resumePath = 'Not Required';
        }
    } else {
        // Standard job requires resume
        if (resumeFile) {
            resumePath = resumeFile.path;
        } else if (useProfileResume === 'true' || useProfileResume === true) {
            resumePath = userData?.resume || null;
            if (!resumePath) {
                res.status(400);
                throw new Error('No resume found on your profile. Please upload one in your Profile first.');
            }
        } else {
            res.status(400);
            throw new Error('Please upload a resume or use your profile resume to apply for this job.');
        }
    }

    console.log('resumePath:', resumePath);

    const existingCheck = await pool.query(
        'SELECT id FROM "Applications" WHERE "jobId" = $1 AND "applicantId" = $2',
        [parseInt(jobId), applicantId]
    );
    if (existingCheck.rows.length > 0) {
        res.status(400);
        throw new Error('You have already applied for this job');
    }

    let resumeText = '';
    let aiAnalysis = { matchScore: 0, feedback: 'Analysis pending.' };
    try {
        if (resumePath && resumePath !== 'Not Required') {
            resumeText = await extractTextFromPDF(resumePath);
            if (resumeText && jobData.description) {
                aiAnalysis = await analyzeResume(resumeText, jobData.description);
                console.log('AI score:', aiAnalysis.matchScore);
            }
        } else {
            aiAnalysis = { matchScore: 100, feedback: 'Auto-approved for competition/mentorship.' };
        }
    } catch (error) {
        console.error('AI analysis error (non-fatal):', error.message);
    }

    const application = await Application.create({
        jobId: parseInt(jobId),
        applicantId,
        resumePath,
        resumeText,
        status: 'Applied',
        aiScore: Math.round(aiAnalysis.matchScore || 0),
        aiFeedback: aiAnalysis.feedback || ''
    });
    console.log('Application created! ID:', application.id);

    res.status(201).json(application);
});


// @desc    Get my applications
// @route   GET /api/applications/my-applications
// @access  Private (Seeker)
const getMyApplications = asyncHandler(async (req, res) => {
    const { pool } = require('../db');

    const query = `
        SELECT
            a.*,
            j.title           AS "jobTitle",
            j.company         AS "companyName",
            j.location        AS "jobLocation",
            j.type            AS "jobType",
            j."recruiterId"   AS "recruiterId",
            u.name            AS "recruiterName",
            u.avatar          AS "recruiterAvatar"
        FROM "Applications" a
        JOIN "Jobs"  j ON a."jobId"       = j.id
        JOIN "Users" u ON j."recruiterId" = u.id
        WHERE a."applicantId" = $1
        ORDER BY a."createdAt" DESC
    `;

    const result = await pool.query(query, [req.user.id]);
    res.json(result.rows);
});

// @desc    Get applications for a job (Recruiter)
// @route   GET /api/applications/job/:jobId
// @access  Private (Recruiter)
const getJobApplications = asyncHandler(async (req, res) => {
    // Check if job belongs to recruiter
    const { pool } = require('../db');
    const { jobId } = req.params;

    // Verify job ownership
    const jobCheck = await pool.query('SELECT "recruiterId" FROM "Jobs" WHERE id = $1', [jobId]);

    if (jobCheck.rows.length === 0) {
        res.status(404);
        throw new Error('Job not found');
    }

    // PostgreSQL may return camelCase columns as lowercase depending on query.
    // Safely grab recruiterId regardless of casing.
    const jobRow = jobCheck.rows[0];
    const dbRecruiterId = jobRow.recruiterId ?? jobRow.recruiterid;
    if (String(dbRecruiterId) !== String(req.user.id)) {
        res.status(403);
        throw new Error('Not authorized to view applications for this job');
    }

    const query = `
        SELECT a.*, 
               u.name as "applicantName", 
               u.email as "applicantEmail",
               u.avatar as "applicantAvatar",
               u.about as "applicantAbout",
               u.skills as "applicantSkills",
               u.education as "applicantEducation",
               u.location as "applicantLocation",
               u.headline as "applicantHeadline"
        FROM "Applications" a
        JOIN "Users" u ON a."applicantId" = u.id
        WHERE a."jobId" = $1
        ORDER BY a."aiScore" DESC
    `;

    try {
        const result = await pool.query(query, [jobId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching applications:", err);
        res.status(500).json({ message: "Database error fetching applications" });
    }
});


// @desc    Update application status (Approve/Reject)
// @route   PUT /api/applications/:id/status
// @access  Private (Recruiter)
const updateApplicationStatus = asyncHandler(async (req, res) => {
    const { status } = req.body; // e.g., 'Shortlisted', 'Rejected'
    const applicationId = req.params.id;
    const { pool } = require('../db');

    // 1. Verify that the application belongs to a job posted by this recruiter
    // Also fetch Job Title and Applicant ID for notification
    const appCheck = await pool.query(`
        SELECT a.id, a."applicantId", j."recruiterId", j.title as "jobTitle"
        FROM "Applications" a
        JOIN "Jobs" j ON a."jobId" = j.id
        WHERE a.id = $1
    `, [applicationId]);

    if (appCheck.rows.length === 0) {
        res.status(404);
        throw new Error('Application not found');
    }

    const applicationData = appCheck.rows[0];

    if (applicationData.recruiterId !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this application');
    }

    // 2. Update the status
    const update = await pool.query(
        'UPDATE "Applications" SET status = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *',
        [status, applicationId]
    );

    // 3. Create Notification
    try {
        await Notification.create({
            userId: applicationData.applicantId,
            type: 'status_update',
            title: `Application Status Update: ${status}`,
            message: `Your application for "${applicationData.jobTitle}" has been moved to: ${status}.`,
            relatedLink: '/seeker/my-applications'
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
        // Don't fail the request if notification fails, just log it
    }

    res.json(update.rows[0]);
});

// @desc    View Resume (Stream PDF)
// @route   GET /api/applications/resume/:filename
// @access  Public (or Protected if needed)
const viewResume = asyncHandler(async (req, res) => {
    const filename = req.params.filename;

    // Construct path. Resumes are in uploads/resumes/
    // We assume filename is just the name, not full path.
    // Security check: prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../uploads/resumes', safeFilename);
    const pdfPath = filePath.endsWith('.pdf') ? filePath : filePath + '.pdf';

    // Check if file exists (try with and without .pdf extension to be safe)
    let finalPath = '';

    if (fs.existsSync(filePath)) {
        finalPath = filePath;
    } else if (fs.existsSync(filePath + '.pdf')) {
        finalPath = filePath + '.pdf';
    } else {
        // Try searching for the file ignoring extension if the requested filename has no extension
        const dir = path.dirname(filePath);
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            const found = files.find(f => f.startsWith(safeFilename));
            if (found) {
                finalPath = path.join(dir, found);
            }
        }
    }

    if (!finalPath || !fs.existsSync(finalPath)) {
        res.status(404);
        throw new Error('Resume file not found');
    }

    // Force headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + safeFilename + '.pdf"');

    const fileStream = fs.createReadStream(finalPath);
    fileStream.pipe(res);
});

// @desc    Get all unique applicants for the recruiter's jobs (for chat contacts)
// @route   GET /api/applications/my-applicants
// @access  Private (Recruiter)
const getMyApplicants = asyncHandler(async (req, res) => {
    const { pool } = require('../db');

    const query = `
        SELECT DISTINCT ON (u.id)
            u.id        AS "seekerId",
            u.name      AS "seekerName",
            u.email     AS "seekerEmail",
            u.avatar    AS "seekerAvatar",
            j.title     AS "jobTitle",
            j.company   AS "company"
        FROM "Applications" a
        JOIN "Jobs"  j ON a."jobId"       = j.id
        JOIN "Users" u ON a."applicantId" = u.id
        WHERE j."recruiterId" = $1
        ORDER BY u.id, u.name ASC
    `;

    const result = await pool.query(query, [req.user.id]);
    res.json(result.rows);
});

module.exports = {
    applyForJob,
    getMyApplications,
    getJobApplications,
    updateApplicationStatus,
    viewResume,
    getMyApplicants
};
