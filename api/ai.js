const express = require('express');
const Groq = require('groq-sdk');
const clientPromise = require('../db');
const router = express.Router();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Simple rate limiter
const requestCounts = new Map();
const rateLimiter = (req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 10;

    if (!requestCounts.has(ip)) requestCounts.set(ip, []);
    const timestamps = requestCounts.get(ip).filter(t => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
        return res.status(429).json({ reply: "I'm getting too many questions! Give me a moment. 😅" });
    }
    timestamps.push(now);
    requestCounts.set(ip, timestamps);
    next();
};

// Helper functions to fetch data from MongoDB (unchanged)
async function getContactInfo() {
    try {
        const client = await clientPromise;
        const db = client.db('portfolio');
        return await db.collection('contact_info').findOne({});
    } catch { return null; }
}

async function getHeroData() {
    try {
        const client = await clientPromise;
        const db = client.db('portfolio');
        return await db.collection('hero').findOne({});
    } catch { return null; }
}

async function getAboutData() {
    try {
        const client = await clientPromise;
        const db = client.db('portfolio');
        return await db.collection('about').findOne({});
    } catch { return null; }
}

async function getProjects() {
    try {
        const client = await clientPromise;
        const db = client.db('portfolio');
        return await db.collection('projects').find({}).sort({ createdAt: -1 }).toArray();
    } catch { return []; }
}

router.post('/chat', rateLimiter, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || message.trim().length < 2) {
            return res.json({ reply: "Could you elaborate a bit? I'd love to give you a helpful answer! 😊" });
        }

        // Fetch live data from MongoDB
        const [contactInfo, heroData, aboutData, projects] = await Promise.all([
            getContactInfo(), getHeroData(), getAboutData(), getProjects()
        ]);

        // Build prompt sections (same as before, omitted for brevity – keep your existing content)
        let contactSection = /* ... */;
        let heroSection = /* ... */;
        let aboutSection = /* ... */;
        let projectsSection = /* ... */;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are Mehedy Hasan's AI assistant... (your full system prompt)`,
                },
                { role: 'user', content: message },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 250,
        });

        const reply = chatCompletion.choices[0].message.content;
        res.json({ reply });
    } catch (error) {
        // Log full error details to Vercel logs
        console.error('Groq API error:', {
            message: error.message,
            status: error.status,
            response: error.response?.data,
            stack: error.stack,
        });

        // Return fallback
        res.json({
            reply: "I'm having a moment — probably too much physics thinking! Try asking again, or reach Mehedy through the contact form below. 😊",
        });
    }
});

module.exports = router;   // ← CRITICAL: This must be present
