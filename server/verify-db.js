require('dotenv').config();
const { pool } = require('./db');
const User = require('./models/User');

async function testDatabase() {
    try {
        console.log('1. Checking connection...');
        const res = await pool.query('SELECT NOW()');
        console.log('   Connected at:', res.rows[0].now);

        console.log('2. checking tables...');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('   Tables found:', tables.rows.map(r => r.table_name).join(', '));

        console.log('3. Attempting to create a test user via Model...');
        const testUser = {
            name: 'Test Manual',
            email: `manual_test_${Date.now()}@gmail.com`,
            password: 'password123',
            role: 'Seeker'
        };

        const createdUser = await User.create(testUser);
        console.log('   User created successfully:', createdUser);

        console.log('4. verifying user in DB...');
        const verify = await pool.query('SELECT * FROM "Users" WHERE email = $1', [testUser.email]);
        if (verify.rows.length > 0) {
            console.log('   SUCCESS: User found in DB!');
        } else {
            console.error('   FAILURE: User NOT found in DB after creation!');
        }

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        pool.end();
    }
}

testDatabase();
