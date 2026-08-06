const express = require('express');
const Groq = require('groq-sdk');
const clientPromise = require('../db');
const router = express.Router();

// Only initialise Groq if the API key exists
let groq;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} else {
    console.error('❌ FATAL: GROQ_API_KEY environment variable is not set.');
}

// Simple rate limiter
const requestCounts = new Map();
const rateLimiter = (req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
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

// --- Helper functions (unchanged) ---
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

// --- Main chat route ---
router.post('/chat', rateLimiter, async (req, res) => {
    if (!groq) {
        return res.status(500).json({
            reply: "The AI assistant is not configured yet. Please set the GROQ_API_KEY on the server.",
        });
    }

    try {
        const { message } = req.body;
        if (!message || message.trim().length < 2) {
            return res.json({ reply: "Could you elaborate a bit? 😊" });
        }

        // Fetch live data from MongoDB
        const [contactInfo, heroData, aboutData, projects] = await Promise.all([
            getContactInfo(), getHeroData(), getAboutData(), getProjects()
        ]);

        // Build dynamic prompt sections (same as before)
        let contactSection = /* ... */;
        let heroSection = /* ... */;
        let aboutSection = /* ... */;
        let projectsSection = /* ... */;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are Mehedy Hasan's AI assistant... (your full system prompt here)`,
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
        console.error('Groq API error:', error);

        // 🔧 TEMPORARY DEBUG – shows the actual error instead of the fallback.
        // Replace this with the friendly fallback after you've fixed the issue.
        res.status(500).json({
            reply: `⚠️ Debug: ${error.message} (HTTP Status: ${error.status || 'none'})`,
        });

        // Original fallback (uncomment when done debugging):
        // res.json({
        //     reply: "I'm having a moment — probably too much physics thinking! Try asking again, or reach Mehedy through the contact form below. 😊",
        // });
    }
});

module.exports = router;
