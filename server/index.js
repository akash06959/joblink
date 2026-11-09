const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const path = require('path');

console.log('Starting server...');
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());

// Load environment variables *before* other imports that might use them
dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log('Dotenv config loaded from:', path.resolve(__dirname, '.env'));
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 10) : 'UNDEFINED');

const { connectDB } = require('./db');
const { startChatServer } = require('./chatServer');
console.log('Imported db.js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
        // Check if it's a PDF or if it's a file in the 'resumes' directory (likely a PDF without extension)
        if (path.extname(filePath).toLowerCase() === '.pdf' || filePath.includes('resumes')) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
        }
    }
}));

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Error Handler Middleware
app.use((err, req, res, next) => {
    // res.statusCode is 200 by default in Express — only use it if it was explicitly set to an error code
    const statusCode = (res.statusCode && res.statusCode !== 200) ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

connectDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Error: Port ${PORT} is already in use. Please stop the other process running on this port or change the PORT in .env.`);
            process.exit(1);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });

    // Start the embedded Socket.IO chat server on port 3001
    startChatServer();
});