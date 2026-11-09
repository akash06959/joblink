
const { connectDB } = require('./db');

console.log('Testing db.js connectDB function...');

connectDB().then(() => {
    console.log('connectDB completed successfully (tables init probably done).');
    process.exit(0);
}).catch(err => {
    console.error('connectDB failed unexpectedly:', err);
    process.exit(1);
});
