const asyncHandler = require('express-async-handler');
const { extractTextFromPDF, analyzeResume } = require('../../utils/aiService');
const { pool } = require('../../db');

// @desc    Check ATS score for a specific job
// @route   POST /api/ai/ats-check/:jobId
// @access  Private (Seeker)
const atsCheckForJob = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const resumeFile = req.file;

    if (!resumeFile) {
        res.status(400);
        throw new Error('Resume file is required (PDF only)');
    }

    if (!jobId) {
        res.status(400);
        throw new Error('Job ID is required');
    }

    // 1. Fetch the job from the database
    const jobResult = await pool.query(
        `SELECT id, title, description, company, location, type, salary, requirements
         FROM "Jobs"
         WHERE id = $1 AND status = 'Open'`,
        [jobId]
    );

    if (jobResult.rows.length === 0) {
        res.status(404);
        throw new Error('Job not found or no longer active');
    }

    const job = jobResult.rows[0];

    // 2. Extract text from the uploaded resume PDF
    const resumeText = await extractTextFromPDF(resumeFile.path);

    if (!resumeText || resumeText.trim().length < 20) {
        res.status(400);
        throw new Error('Could not extract text from resume. Please ensure it is a text-based PDF.');
    }

    // 3. Build a rich job description for the ML engine
    // Combine description + requirements for better skill matching
    let jobcareerMLText = job.description || '';
    if (job.requirements && Array.isArray(job.requirements) && job.requirements.length > 0) {
        jobcareerMLText += '\n\nRequired Skills: ' + job.requirements.join(', ');
    }

    console.log(`Running ATS check for job: "${job.title}" (ID: ${jobId})`);

    const analysis = await analyzeResume(resumeText, jobcareerMLText);

    // Add warning if fallback was triggered locally
    if (analysis && analysis.matchScore === 0 && analysis.semanticScore === 0 && analysis.keywordScore === 0 && analysis.feedback.includes("fallback")) {
        res.status(422);
        throw new Error('Local ML Server returned 0 score. Your resume PDF might be an image without text layer, or the ML server is rejecting it.');
    }

    // 5. Return structured ATS report
    res.json({
        success: true,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        // Core ATS results
        overallScore: analysis.matchScore || 0,
        semanticScore: analysis.semanticScore || 0,
        keywordScore: analysis.keywordScore || 0,
        matchLevel: analysis.matchLevel || '',
        // Skill breakdown
        matchedSkills: analysis.matchedQualifications || [],
        missingSkills: analysis.missingRequirements || [],
        // Actionable advice
        recommendation: analysis.feedback || '',
        // For the "Apply Now" convenience link
        applyUrl: `/seeker/jobs/${job.id}`
    });
});

module.exports = { atsCheckForJob };
