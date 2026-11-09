require('dotenv').config();
const { pool } = require('./db');
async function run() {
    try {
        const result = await pool.query('SELECT id, email, role FROM "Users" WHERE role = \'Seeker\' LIMIT 1');
        console.log(JSON.stringify(result.rows[0]));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
run();
