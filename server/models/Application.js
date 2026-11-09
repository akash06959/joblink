const { pool } = require('../db');

class Application {
    constructor(row) {
        if (row) {
            this.id = row.id;
            this.jobId = row.jobId;
            this.applicantId = row.applicantId;
            this.resumePath = row.resumePath;
            this.resumeText = row.resumeText;
            this.status = row.status;
            this.aiScore = row.aiScore;
            this.aiFeedback = row.aiFeedback;
            this.createdAt = row.createdAt;
            this.updatedAt = row.updatedAt;
        }
    }

    static async create(data) {
        const now = new Date();
        const res = await pool.query(
            'INSERT INTO "Applications" ("jobId", "applicantId", "resumePath", "resumeText", status, "aiScore", "aiFeedback", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [data.jobId, data.applicantId, data.resumePath, data.resumeText, data.status || 'Applied', data.aiScore || 0, data.aiFeedback || '', now, now]
        );
        return new Application(res.rows[0]);
    }

    // Add findOne and other methods as needed
}

module.exports = Application;
