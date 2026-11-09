const asyncHandler = require('express-async-handler');
const { extractTextFromPDF, analyzeResume } = require('../../utils/aiService');
const Job = require('../../models/Job');
const fs = require('fs');

// @desc    Analyze a resume against a job description
// @route   POST /api/ai/analyze-resume
// @access  Public (for testing) or Protected
const analyzeResumeController = asyncHandler(async (req, res) => {
    // 1. Check if file exists
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a PDF resume');
    }

    // 2. Get Job Description
    const { jobDescription, jobId } = req.body;

    let finalJobDescription = jobDescription;

    // If jobId is provided, fetch description from DB
    if (jobId) {
        const job = await Job.findByPk(jobId);
        if (!job) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            res.status(404);
            throw new Error('Job not found');
        }
        finalJobDescription = job.description;
    }

    if (!finalJobDescription) {
        fs.unlinkSync(req.file.path);
        res.status(400);
        throw new Error('Please provide either jobDescription or jobId');
    }

    try {
        // 3. Extract Text
        const resumeText = await extractTextFromPDF(req.file.path);

        // 4. Analyze with AI
        const analysisResult = await analyzeResume(resumeText, finalJobDescription);

        // 5. Cleanup (optional, or keep file if saving application later)
        // For this specific specific pure analysis endpoint, we might want to delete it to save space
        // But if this was an 'Apply' endpoint, we'd keep it.
        // Let's delete it for now as this is just an "Analyze" tool endpoint.
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            data: analysisResult,
        });

    } catch (error) {
        // Attempt cleanup on error
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500);
        throw new Error(error.message);
    }
});

module.exports = {
    analyzeResumeController,
};
