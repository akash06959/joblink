require('dotenv').config();
const { pool } = require('./db');

async function listUsers() {
    try {
        const res = await pool.query('SELECT id, name, email, role FROM "Users"');
        console.log('--- Current Users in DB ---');
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listUsers();
