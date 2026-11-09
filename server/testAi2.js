require('dotenv').config();
const { pool } = require('./db');
const { extractTextFromPDF, extractProfileDetails } = require('./utils/aiService');

(async () => {
    try {
        const res = await pool.query('SELECT resume FROM "Users" WHERE resume IS NOT NULL ORDER BY id DESC LIMIT 1');
        if (res.rows.length === 0) {
            console.log("No users with resume found.");
            process.exit(0);
        }
        const resumePath = res.rows[0].resume;
        console.log("Resume path from DB:", resumePath);

        console.log("Extracting text...");
        const text = await extractTextFromPDF(resumePath);
        console.log("Extracted text length:", text.length);

        console.log("Extracting profile details...");
        const details = await extractProfileDetails(text);
        console.log("Details:", details);
    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        process.exit(0);
    }
})();
