/**
 * Migration: Add 'responsibilities' column to Jobs table.
 * Run once with: node server/add_responsibilities_column.js
 */
const { pool } = require('./db');

async function migrate() {
    try {
        await pool.query(`
            ALTER TABLE "Jobs"
            ADD COLUMN IF NOT EXISTS responsibilities TEXT[] DEFAULT '{}';
        `);
        console.log('✅  responsibilities column added (or already existed).');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
