const { pool } = require('./db');

async function diagnose() {
    // 1. Check for any rows in Applications (including with null fields)
    const all = await pool.query('SELECT * FROM "Applications"');
    console.log('Total applications (raw SELECT *):', all.rows.length);

    // 2. Simulate exact insert the server does
    const now = new Date();
    const testPath = 'uploads\\resumes\\resume-test-diag.pdf';  // Windows-style path

    try {
        const result = await pool.query(
            'INSERT INTO "Applications" ("jobId", "applicantId", "resumePath", "resumeText", status, "aiScore", "aiFeedback", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [21, 8, testPath, 'test resume text from pdf', 'Applied', 0, 'Analysis failed or pending.', now, now]
        );
        console.log('INSERT SUCCEEDED! Row ID:', result.rows[0].id);

        // clean up
        await pool.query('DELETE FROM "Applications" WHERE id = $1', [result.rows[0].id]);
        console.log('Cleaned up test row');

        // Now check if there's ALREADY a (21, 8) pair
        const dup = await pool.query('SELECT id FROM "Applications" WHERE "jobId" = $1 AND "applicantId" = $2', [21, 8]);
        console.log('Existing (jobId=21, applicantId=8) entries:', dup.rows.length);
    } catch (e) {
        console.error('INSERT FAILED:', e.message);
        console.error('Detail:', e.detail);
        console.error('Code:', e.code);
    }

    // 3. Show all constraint violations
    const constraints = await pool.query(`
        SELECT conname, contype, condeferrable, condeferred 
        FROM pg_constraint 
        WHERE conrelid = '"Applications"'::regclass
    `);
    console.log('\nConstraints on Applications:', constraints.rows);

    process.exit(0);
}
diagnose().catch(e => { console.error(e.message); process.exit(1); });
