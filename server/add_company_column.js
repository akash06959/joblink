const { pool } = require('./db');

const addCompanyColumn = async () => {
    try {
        console.log('Adding companyName column to Users table...');
        await pool.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "companyName" VARCHAR(255);');
        console.log('Successfully added companyName column.');
        process.exit(0);
    } catch (err) {
        console.error('Error adding column:', err);
        process.exit(1);
    }
};

addCompanyColumn();
