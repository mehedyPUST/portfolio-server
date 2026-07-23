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
const aiRoute = require('./api/ai');
const contactInfoRoute = require('./api/contact-info');

const app = express();

// CORS — allow cookies from frontend
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'https://mehedy-pust.vercel.app',
        credentials: true,
    })
);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Routes
app.use('/api/contact', contactRoute);
app.use('/api/admin', adminRoute);
app.use('/api/hero', heroRoute);
app.use('/api/about', aboutRoute);
app.use('/api/projects', projectsRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/ai', aiRoute);
app.use('/api/contact-info', contactInfoRoute);

// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'Mehedy Hasan Portfolio API',
        version: '1.0.0',
        endpoints: [
            '/api/contact',
            '/api/admin/login',
            '/api/admin/verify',
            '/api/admin/logout',
            '/api/hero',
            '/api/about',
            '/api/projects',
            '/api/projects/featured',
            '/api/upload',
            '/api/ai/chat',
            '/api/contact-info',
        ],
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
}

// Export for Vercel
module.exports = app;