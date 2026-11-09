const { pool } = require('./db');

async function checkJobs() {
    try {
        const result = await pool.query('SELECT id, title, status FROM "Jobs" LIMIT 10');
        console.log('Jobs in database:', result.rows);

        const openJobs = await pool.query('SELECT COUNT(*) FROM "Jobs" WHERE status = $1', ['Open']);
        console.log('\nTotal Open jobs:', openJobs.rows[0].count);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkJobs();
