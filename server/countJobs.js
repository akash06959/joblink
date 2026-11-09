require('dotenv').config();
const { pool } = require('./db');
async function run() {
    try {
        const result = await pool.query('SELECT count(*) FROM "Jobs"');
        console.log('Total Jobs:', result.rows[0].count);
        const statuses = await pool.query('SELECT DISTINCT status FROM "Jobs"');
        console.log('Statuses:', statuses.rows.map(r => r.status));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
run();
