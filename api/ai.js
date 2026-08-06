const express = require('express');
const Groq = require('groq-sdk');
const clientPromise = require('../db');
const router = express.Router();

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

// --- Helper functions (return minimal data) ---
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

async function getProjects() {
    try {
        const client = await clientPromise;
        const db = client.db('portfolio');
        // Only fetch featured or first 3 projects, with only name, tech, description
        return await db.collection('projects')
            .find({ featured: true })
            .project({ name: 1, tech: 1, description: 1, featured: 1 })
            .limit(3)
            .toArray();
    } catch { return []; }
}

// --- Main chat route ---
router.post('/chat', rateLimiter, async (req, res) => {
    if (!groq) {
        return res.status(500).json({
            reply: "AI not configured. Please set the GROQ_API_KEY.",
        });
    }

    try {
        const { message } = req.body;
        if (!message || message.trim().length < 2) {
            return res.json({ reply: "Could you elaborate a bit? 😊" });
        }

        // Fetch only necessary data
        const [contactInfo, heroData, projects] = await Promise.all([
            getContactInfo(),
            getHeroData(),
            getProjects(),
        ]);

        // Build extremely concise data strings
        let contactStr = 'No contact info yet.';
        if (contactInfo && (contactInfo.email || contactInfo.phone)) {
            const parts = [];
            if (contactInfo.email) parts.push(`Email: ${contactInfo.email}`);
            if (contactInfo.phone) parts.push(`Phone: ${contactInfo.phone}`);
            if (contactInfo.linkedin) parts.push(`LinkedIn: ${contactInfo.linkedin}`);
            if (contactInfo.github) parts.push(`GitHub: ${contactInfo.github}`);
            if (contactInfo.facebook) parts.push(`Facebook: ${contactInfo.facebook}`);
            contactStr = parts.join(', ');
        }

        let heroStr = 'Mehedy Hasan, Full-Stack Developer.';
        if (heroData) {
            heroStr = `${heroData.title || 'Mehedy Hasan'} - ${heroData.subtitle || 'Full-Stack Developer'}. ${heroData.description || ''}`.trim();
        }

        let projectsStr = 'No projects listed.';
        if (projects && projects.length > 0) {
            projectsStr = projects.map(p => `- ${p.name}: ${p.tech}`).join('\n');
        }

        const systemPrompt = `You are Mehedy Hasan's AI assistant. Keep answers 1-2 sentences, friendly. Use the info below:
Profile: ${heroStr}
Contact: ${contactStr}
Projects: ${projectsStr}
If asked something not here, suggest the contact form.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 150, // reduced
        });

        const reply = chatCompletion.choices[0].message.content;
        res.json({ reply });
    } catch (error) {
        console.error('Groq API error:', error);
        res.status(500).json({
            reply: `⚠️ Debug: ${error.message} (Status: ${error.status || 'none'})`,
        });
    }
});

module.exports = router;
