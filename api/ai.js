const express = require('express');
const Groq = require('groq-sdk');
const clientPromise = require('../db');
const router = express.Router();

// Only create the Groq client if the key exists – prevents crash on startup
let groq;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} else {
    console.error('❌ FATAL: GROQ_API_KEY environment variable is not set.');
}

// Simple in-memory rate limiter
const requestCounts = new Map();
const rateLimiter = (req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10;

    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
    }

    const timestamps = requestCounts.get(ip).filter(t => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
        return res.status(429).json({
            reply: "I'm getting too many questions! Give me a moment. 😅",
        });
    }

    timestamps.push(now);
    requestCounts.set(ip, timestamps);
    next();
};

// --- Helper functions to fetch live data from MongoDB ---
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
    // If Groq client is missing (no API key), return immediately
    if (!groq) {
        return res.status(500).json({
            reply: "The AI assistant is not configured yet. Please set the GROQ_API_KEY on the server.",
        });
    }

    try {
        const { message } = req.body;

        if (!message || message.trim().length < 2) {
            return res.json({
                reply: "Could you elaborate a bit? I'd love to give you a helpful answer! 😊",
            });
        }

        // Fetch all live data from DB
        const [contactInfo, heroData, aboutData, projects] = await Promise.all([
            getContactInfo(),
            getHeroData(),
            getAboutData(),
            getProjects(),
        ]);

        // Build dynamic contact section
        let contactSection = '';
        if (contactInfo && (contactInfo.email || contactInfo.phone)) {
            contactSection = `
CURRENT CONTACT INFORMATION (live from database):
- 📧 Email: ${contactInfo.email || 'Not provided'}
- 📱 Phone: ${contactInfo.phone || 'Not provided'}
- 💬 WhatsApp: ${contactInfo.whatsapp || 'Not provided'}
- 💼 LinkedIn: ${contactInfo.linkedin || 'Not provided'}
- 👨‍💻 GitHub: ${contactInfo.github || 'Not provided'}
- 📘 Facebook: ${contactInfo.facebook || 'Not provided'}
- 📍 Location: ${contactInfo.location || 'Pabna, Bangladesh'}
- 🌐 Portfolio: ${contactInfo.portfolio || 'https://mehedy-pust.vercel.app'}`;
        } else {
            contactSection = `
CONTACT INFORMATION:
No contact details in database yet. Tell visitors to use the contact form on the portfolio.`;
        }

        // Build dynamic hero section
        let heroSection = '';
        if (heroData) {
            heroSection = `
CURRENT HERO/PROFILE INFO (live from database):
- Name: ${heroData.title || 'Mehedy Hasan'}
- Designation: ${heroData.subtitle || 'Full-Stack Developer'}
- Description: ${heroData.description || 'Physics researcher turned developer'}
- Resume: ${heroData.resumeLink || 'Available on portfolio'}
- GitHub: ${heroData.github || 'Not provided'}
- LinkedIn: ${heroData.linkedin || 'Not provided'}
- Facebook: ${heroData.facebook || 'Not provided'}`;
        }

        // Build dynamic about section
        let aboutSection = '';
        if (aboutData && aboutData.paragraphs && aboutData.paragraphs.length > 0) {
            aboutSection = `
CURRENT ABOUT INFO (live from database):
${aboutData.paragraphs.map((p, i) => `Paragraph ${i + 1}: ${p}`).join('\n')}`;
        }

        // Build dynamic projects section
        let projectsSection = '';
        if (projects && projects.length > 0) {
            projectsSection = `
CURRENT PROJECTS (live from database):
${projects.map((p) => `- ${p.name} (${p.tech || 'N/A'}): ${p.description || ''} ${p.featured ? '[FEATURED]' : ''}`).join('\n')}`;
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are Mehedy Hasan's AI assistant on his portfolio website. You have access to live data from his database.

ABOUT MEHEDY (static):
- Full-stack web developer from Pabna, Bangladesh
- MSc in Physics from Pabna University of Science & Technology (PUST)
- Thesis: Solid State Physics
- Web dev training: Programming Hero Bootcamp (Batch 13)
- Skills: Next.js, React, Tailwind CSS, JavaScript, TypeScript, Node.js, Express, MongoDB, JWT, Nodemailer, Framer Motion, Git, Vercel
- Hobbies: Chess, science documentaries, quantum mechanics

${heroSection}

${aboutSection}

${contactSection}

${projectsSection}

RULES:
- Keep responses friendly and short (1-3 sentences)
- When asked for contact info, email, phone, social links — share from CURRENT CONTACT INFORMATION above
- When asked about projects — share from CURRENT PROJECTS above
- When asked about Mehedy's background — share from CURRENT ABOUT INFO or HERO/PROFILE INFO
- Use emojis when sharing contact details
- If data says "Not provided", suggest the contact form
- If asked something unknown, say: "I don't have that info, but you can reach Mehedy through his portfolio's contact form!"`,
                },
                {
                    role: 'user',
                    content: message,
                },
            ],
           model: 'gemma2-9b-it',
            temperature: 0.7,
            max_tokens: 250,
        });

        const reply = chatCompletion.choices[0].message.content;
        res.json({ reply });
    } catch (error) {
        // Log full error details for debugging
        console.error('Groq API error:', {
            message: error.message,
            status: error.status,
            stack: error.stack,
        });

        // Return a graceful fallback message instead of crashing
        res.json({
            reply: "I'm having a moment — probably too much physics thinking! Try asking again, or reach Mehedy through the contact form below. 😊",
        });
    }
});

module.exports = router;
