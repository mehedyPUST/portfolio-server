require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import routes
const contactRoute = require('./api/contact');
const adminRoute = require('./api/admin');
const heroRoute = require('./api/hero');
const aboutRoute = require('./api/about');
const projectsRoute = require('./api/projects');
const uploadRoute = require('./api/upload');

const app = express();

// CORS — allow cookies from frontend
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Public routes
app.use('/api/contact', contactRoute);
app.use('/api/admin', adminRoute);
app.use('/api/hero', heroRoute);
app.use('/api/about', aboutRoute);
app.use('/api/projects', projectsRoute);
app.use('/api/upload', uploadRoute);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Mehedy Portfolio API is running' });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel serverless
module.exports = app;