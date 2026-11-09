const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { pool } = require('./db');

pool.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS avatar TEXT')
    .then(() => { console.log('✅ avatar column added to Users table'); process.exit(0); })
    .catch(e => { console.error('❌', e.message); process.exit(1); });
