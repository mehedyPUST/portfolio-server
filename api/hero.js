const express = require('express');
const clientPromise = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// GET /api/hero
router.get('/', async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db('portfolio');
        const hero = await db.collection('hero').findOne({});
        res.json(hero || {});
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch hero data' });
    }
});

// PUT /api/hero (protected)
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { title, subtitle, description, resumeLink, github, linkedin, facebook, photoUrl } = req.body;

        const client = await clientPromise;
        const db = client.db('portfolio');

        const heroData = {
            title,
            subtitle,
            description,
            resumeLink,
            github,
            linkedin,
            facebook,
            photoUrl,
            updatedAt: new Date(),
        };

        await db.collection('hero').updateOne(
            {},
            { $set: heroData },
            { upsert: true }
        );

        res.json({ success: true, message: 'Hero updated successfully' });
    } catch (error) {
        console.error('Hero update error:', error);
        res.status(500).json({ error: 'Failed to update hero' });
    }
});

module.exports = router;