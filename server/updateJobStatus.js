require('dotenv').config();
const { pool } = require('./db');
async function run() {
    try {
        const result = await pool.query("UPDATE \"Jobs\" SET status = 'Open' WHERE status = 'Active'");
        console.log('Updated jobs:', result.rowCount);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
run();
