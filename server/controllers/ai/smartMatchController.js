const asyncHandler = require('express-async-handler');
const { extractTextFromPDF, analyzeResume, suggestJobRoles } = require('../../utils/aiService');
const { pool } = require('../../db');

// @desc    Smart match resume against all available jobs
// @route   POST /api/ai/smart-match
// @access  Private (Seeker)
const smartMatchResume = asyncHandler(async (req, res) => {
    const resumeFile = req.file;

    if (!resumeFile) {
        res.status(400);
        throw new Error('Resume file is required (PDF only)');
    }
    try {
        // 1. Extract text from resume
        const resumeText = await extractTextFromPDF(resumeFile.path);

        if (!resumeText || resumeText.trim().length <= 50) {
            res.status(422);
            throw new Error('PDF parsing failed. Ensure the resume has selectable text, not an image.');
        }

        // 2. Get AI-suggested job roles based on resume (parallel with job fetching)
        const suggestedRolesPromise = suggestJobRoles(resumeText);

        // 3. Fetch all active jobs from database
        const jobsQuery = `
            SELECT j.id, j.title, j.description, j.company, j.location, j.type, j.salary, j.requirements
            FROM "Jobs" j
            WHERE j.status = 'Open'
            ORDER BY j."createdAt" DESC
            LIMIT 50
        `;

        const jobsResult = await pool.query(jobsQuery);
        const allJobs = jobsResult.rows;

        if (allJobs.length === 0) {
            const suggestedRoles = await suggestedRolesPromise;
            return res.json({
                success: true,
                matchingJobs: [],
                suggestedRoles,
                message: 'No active jobs available at the moment, but here are recommended roles based on your resume'
            });
        }

        // 4. Analyze resume against each job
        console.log(`Analyzing resume against ${allJobs.length} jobs...`);
        const matchPromises = allJobs.map(async (job) => {
            try {
                console.log(`Analyzing job: ${job.title}...`);
                const analysis = await analyzeResume(resumeText, job.description);
                console.log(`${job.title} - Match Score: ${analysis.matchScore}%`);
                return {
                    id: job.id,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    description: job.description,
                    type: job.type,
                    salary: job.salary,
                    matchScore: analysis.matchScore || (analysis.semanticScore ? Math.round(analysis.semanticScore * 0.7 + analysis.keywordScore * 0.3) : 0),
                    semanticScore: analysis.semanticScore || 0,
                    keywordScore: analysis.keywordScore || 0,
                    matchLevel: analysis.matchLevel || "",
                    feedback: analysis.feedback || "",
                    recommendations: analysis.recommendations || [],
                    matchedQualifications: analysis.matchedQualifications || [],
                    missingRequirements: analysis.missingRequirements || [],
                    rawAnalysis: analysis.rawAnalysis || null
                };
            } catch (error) {
                console.error(`Error analyzing job ${job.id} (${job.title}):`, error.message);
                return null;
            }
        });

        const [results, suggestedRoles] = await Promise.all([
            Promise.all(matchPromises),
            suggestedRolesPromise
        ]);

        const allMatches = results.filter(job => job !== null);

        console.log(`Analysis complete. All match scores:`, allMatches.map(m => ({ title: m.title, score: m.matchScore })));

        // 5. Sort by match score and get top matches
        const matchingJobs = allMatches
            .filter(job => job.matchScore >= 30) // Only show jobs with at least 30% match
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 10); // Top 10 matches

        console.log(`Jobs with score >= 30: ${matchingJobs.length}`);

        res.json({
            success: true,
            matchingJobs,
            suggestedRoles,
            totalJobsAnalyzed: allJobs.length
        });

    } catch (error) {
        console.error('\n================ SMART MATCH CRITICAL ERROR ================');
        console.error('Exact Error Message:', error.message);
        console.error('Stack Trace:', error.stack);
        console.error('==========================================================\n');

        res.status(500);
        throw new Error(`Failed to analyze resume: ${error.message}`);
    }
});

module.exports = {
    smartMatchResume
};
