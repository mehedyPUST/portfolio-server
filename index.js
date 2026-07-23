require('dotenv').config();
const express = require('express');
const cors = require('cors');
const contactRoute = require('./api/contact');

const app = express();

// CORS — allow your frontend domain
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['POST', 'GET'],
        credentials: true,
    })
);

app.use(express.json());

// Routes
app.use('/api/contact', contactRoute);

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