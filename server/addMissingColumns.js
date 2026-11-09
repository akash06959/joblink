const { pool } = require('./db');

async function addMissingColumns() {
    try {
        console.log('Adding missing columns to Users table...\n');

        const alterations = [
            { col: 'resume', type: 'TEXT', sql: 'ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS resume TEXT' },
            { col: 'about', type: 'TEXT', sql: 'ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS about TEXT' },
            { col: 'skills', type: 'TEXT[]', sql: 'ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS skills TEXT[]' },
            { col: 'education', type: 'TEXT', sql: 'ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS education TEXT' },
        ];

        for (const alt of alterations) {
            await pool.query(alt.sql);
            console.log(`✓ Column '${alt.col}' (${alt.type}) added / already exists`);
        }

        // Verify
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Users' 
            ORDER BY ordinal_position
        `);
        console.log('\nFinal Users table columns:');
        res.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

addMissingColumns();
