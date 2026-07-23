const express = require('express');
const clientPromise = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// GET /api/about
router.get('/', async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db('portfolio');
        const about = await db.collection('about').findOne({});
        res.json(about || { paragraphs: [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch about data' });
    }
});

// PUT /api/about (protected)
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { paragraphs } = req.body;

        if (!paragraphs || !Array.isArray(paragraphs)) {
            return res.status(400).json({ error: 'Paragraphs array required' });
        }

        const client = await clientPromise;
        const db = client.db('portfolio');

        await db.collection('about').updateOne(
            {},
            { $set: { paragraphs, updatedAt: new Date() } },
            { upsert: true }
        );

        res.json({ success: true, message: 'About updated successfully' });
    } catch (error) {
        console.error('About update error:', error);
        res.status(500).json({ error: 'Failed to update about' });
    }
});

module.exports = router;