const express = require('express');
const clientPromise = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// GET — public
router.get('/', async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db('portfolio');
        const data = await db.collection('contact_info').findOne({});
        res.json(data || {});
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contact info' });
    }
});

// PUT — admin only
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { email, phone, whatsapp, github, linkedin, facebook, location, portfolio } = req.body;

        const client = await clientPromise;
        const db = client.db('portfolio');

        const data = {
            email: email || '',
            phone: phone || '',
            whatsapp: whatsapp || '',
            github: github || '',
            linkedin: linkedin || '',
            facebook: facebook || '',
            location: location || 'Pabna, Bangladesh',
            portfolio: portfolio || '',
            updatedAt: new Date(),
        };

        await db.collection('contact_info').updateOne({}, { $set: data }, { upsert: true });

        res.json({ success: true, message: 'Contact info updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update contact info' });
    }
});

module.exports = router;