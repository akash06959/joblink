const fs = require('fs');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Extract text from PDF
const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text || '';
    } catch (error) {
        console.error('Error in extractTextFromPDF (non-fatal):', error.message);
        return ''; // Return empty string so application can still be saved
    }
};


// Analyze Resume against Job Description
const analyzeResume = async (resumeText, jobDescription) => {
    try {
        console.log('Sending resume analysis request to local ML Engine...');
        const response = await axios.post('http://localhost:8000/api/analyze-text', {
            resume_text: resumeText,
            job_description: jobDescription
        });

        const data = response.data;
        console.log('Received response from local ML Engine');

        return {
            matchScore: Math.round(data.overall_match_score || (data.ats_match_score ? data.ats_match_score : 0)),
            semanticScore: data.semantic_score || 0,
            keywordScore: data.keyword_score || 0,
            matchLevel: data.match_level || "",
            feedback: data.recommendation || (data.improvement_suggestions ? data.improvement_suggestions.join(' ') : 'No feedback provided.'),
            matchedQualifications: data.matched_skills || [],
            missingRequirements: data.missing_skills || [],
            recommendations: data.recommended_roles || [],
            rawAnalysis: data // pass the entire object as raw if they need deeper breakdown
        };
    } catch (error) {
        console.error('Local ML API Error:', error.message);
        console.log('Using fallback keyword matching...');
        return calculateFallbackScore(resumeText, jobDescription);
    }
};

const extractSkills = async (resumeText) => {
    if (!process.env.GEMINI_API_KEY) {
        return ['React', 'JavaScript', 'Node.js']; // Mock data
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `
            Extract the top 5 technical skills or keywords from the following resume text.
            Return ONLY a JSON array of strings. Example: ["React", "Python", "SQL"].
            Resume Text: "${resumeText.substring(0, 5000)}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error('AI Verify Error:', error);
        return [];
    }
};

const extractProfileDetails = async (resumeText) => {
    if (!process.env.GEMINI_API_KEY) {
        return {
            about: "Experienced software engineer.",
            skills: ["React", "JavaScript", "Node.js"],
            education: "B.Tech in Computer Science"
        }; // Mock data
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `
            Extract the following profile details from the resume text:
            - about: A short professional summary (max 3 sentences).
            - skills: A JSON array of the top 5-10 technical skills as strings.
            - education: A concise string summarizing the highest education degree and institution.
            
            Return ONLY a valid JSON object with the keys "about", "skills", and "education". Example format:
            {"about": "A software engineer...", "skills": ["Python", "React"], "education": "B.S. Computer Science from MIT"}
            
            Resume Text: "${resumeText.substring(0, 5000)}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(cleanText);

        // If the AI somehow returned empty fields, throw an error so we don't silently fail
        if (!parsed.about && (!parsed.skills || parsed.skills.length === 0) && !parsed.education) {
            throw new Error('AI returned empty profile details');
        }

        return parsed;

    } catch (error) {
        console.error('AI Extract Profile Error:', error.message || error);
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            throw new Error('Google Gemini Quota Exhausted. Please wait 1 minute or upgrade your plan.');
        }
        throw new Error('Failed to extract details using AI. Please try again or fill manually.');
    }
};

// Helper for fallback keyword matching
const calculateFallbackScore = (resumeText, jobDescription) => {
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDescription.toLowerCase();

    // Common tech keywords to look for
    const keywords = [
        'react', 'node', 'javascript', 'typescript', 'python', 'java', 'c++', 'sql',
        'mongo', 'aws', 'docker', 'kubernetes', 'git', 'html', 'css', 'redux',
        'express', 'django', 'flask', 'fastapi', 'postgresql', 'mysql', 'rest api',
        'machine learning', 'data analysis', 'devops', 'cloud', 'frontend', 'backend', 'full stack'
    ];

    let matchCount = 0;
    const foundKeywords = [];
    const missingKeywords = [];

    // Check for keywords in job description vs resume
    keywords.forEach(keyword => {
        if (jobLower.includes(keyword)) {
            if (resumeLower.includes(keyword)) {
                matchCount++;
                foundKeywords.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
            } else {
                missingKeywords.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
            }
        }
    });

    // Calculate score based on matched keywords ratio (simple heuristic)
    const totalJobKeywords = foundKeywords.length + missingKeywords.length;
    let score = totalJobKeywords > 0 ? Math.round((matchCount / totalJobKeywords) * 100) : 50;

    // Boost score if resume contains job title words
    if (totalJobKeywords === 0) score = 70; // Default if no keywords found

    let feedbackText = '';
    if (totalJobKeywords > 0) {
        if (matchCount === totalJobKeywords) {
            feedbackText = `This candidate is an excellent match. They possess all ${totalJobKeywords} key technical skills detected in the job description.`;
        } else if (matchCount >= totalJobKeywords / 2) {
            feedbackText = `This candidate is a strong match. They possess ${matchCount} out of ${totalJobKeywords} key technical skills detected in the job description.\nMissing skills: ${missingKeywords.slice(0, 3).join(', ')}`;
        } else {
            feedbackText = `This candidate's profile does not closely match the core technical requirements. They possess only ${matchCount} out of ${totalJobKeywords} detected keywords.\nMissing skills: ${missingKeywords.slice(0, 3).join(', ')}`;
        }
    } else {
        feedbackText = "Match based on keyword analysis. The system could not detect specific technical keywords in the job description to match against this resume.";
    }

    return {
        matchScore: Math.min(score + 10, 95), // Add a small boost
        matchedQualifications: foundKeywords,
        missingRequirements: missingKeywords,
        recommendations: missingKeywords.slice(0, 3).map(k => `Recommend acquiring ${k} for future opportunities.`),
        feedback: feedbackText
    };
};

// Suggest suitable job roles based on resume
const suggestJobRoles = async (resumeText) => {
    try {
        console.log('Sending role suggestion request to local ML Engine...');
        const response = await axios.post('http://localhost:8000/api/suggest-roles', {
            resume_text: resumeText
        });

        console.log('Received suggested roles from local ML Engine');
        // Return the entire structured data instead of just the role strings
        const data = response.data;
        if (data && data.recommended_roles) {
            return data;
        }

        // Safety hook if format is strange
        return {
            recommended_roles: (data.roles || ['Software Developer']).map(r => ({ role: r, fit_score: 0, confidence: 'Low' })),
            career_advice: 'We could not generate specific career advice.',
            roles: data.roles || ['Software Developer']
        };

    } catch (error) {
        console.error('Local ML API Error (Fallback to keywords):', error.message);

        // Fallback based on keywords (only pushing max 5 unique)
        const resumeLower = resumeText.toLowerCase();
        const rolesSet = new Set();

        if (resumeLower.includes('react') || resumeLower.includes('frontend') || resumeLower.includes('html')) rolesSet.add('Frontend Developer');
        if (resumeLower.includes('node') || resumeLower.includes('backend') || resumeLower.includes('django')) rolesSet.add('Backend Developer');
        if (resumeLower.includes('full stack') || (resumeLower.includes('frontend') && resumeLower.includes('backend'))) rolesSet.add('Full Stack Developer');
        if (resumeLower.includes('data') || resumeLower.includes('python') || resumeLower.includes('sql')) rolesSet.add('Data Analyst');
        if (resumeLower.includes('machine learning') || resumeLower.includes('ai')) rolesSet.add('Machine Learning Engineer');
        if (resumeLower.includes('devops') || resumeLower.includes('aws') || resumeLower.includes('docker')) rolesSet.add('DevOps Engineer');

        const roles = Array.from(rolesSet);
        const finalRoles = roles.length > 0 ? roles.slice(0, 5) : ['Software Developer', 'Web Developer', 'Software Engineer', 'Frontend Developer', 'Backend Developer'];

        return {
            recommended_roles: finalRoles.map(r => ({ role: r, fit_score: Math.floor(Math.random() * 20) + 45, confidence: 'Low' })),
            career_advice: 'Based on your extracted skills, we recommend focusing on building deeper domain expertise. Consider pursuing relevant certifications and expanding your portfolio with real-world projects to stand out to employers.',
            roles: finalRoles
        };
    }
};

module.exports = {
    extractTextFromPDF,
    analyzeResume,
    extractSkills,
    extractProfileDetails,
    suggestJobRoles,
    calculateFallbackScore // Export for testing if needed
};
