const { pool } = require('./db');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        const email = 'admin'; // Using 'admin' as username/email
        const password = 'admin@123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user exists
        const res = await client.query('SELECT * FROM "Users" WHERE email = $1', [email]);

        if (res.rows.length > 0) {
            console.log('Admin user already exists. Updating role and password...');
            await client.query(
                'UPDATE "Users" SET role = $1, password = $2 WHERE email = $3',
                ['Admin', hashedPassword, email]
            );
            console.log('Admin user updated successfully.');
        } else {
            console.log('Creating new Admin user...');
            await client.query(
                'INSERT INTO "Users" (name, email, password, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
                ['Admin User', email, hashedPassword, 'Admin']
            );
            console.log('Admin user created successfully.');
        }

        console.log(`\nlogin with:\nEmail: ${email}\nPassword: ${password}`);

        client.release();
        process.exit();
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
