const express = require('express');
const { ObjectId } = require('mongodb');
const clientPromise = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// GET all — sorted by order
router.get('/', async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db('portfolio');
        const projects = await db.collection('projects').find({}).sort({ order: 1, createdAt: -1 }).toArray();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// GET featured — sorted by order
router.get('/featured', async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db('portfolio');
        const projects = await db.collection('projects').find({ featured: true }).sort({ order: 1, createdAt: -1 }).limit(3).toArray();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch featured projects' });
    }
});

// PUT /reorder — admin only (batch update order)
router.put('/reorder', authMiddleware, async (req, res) => {
    try {
        const { orderedIds } = req.body; // array of project _id in new order
        if (!orderedIds || !Array.isArray(orderedIds)) {
            return res.status(400).json({ error: 'orderedIds array required' });
        }

        const client = await clientPromise;
        const db = client.db('portfolio');

        // Update each project's order based on its position in the array
        const bulkOps = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: new ObjectId(id) },
                update: { $set: { order: index } },
            },
        }));

        await db.collection('projects').bulkWrite(bulkOps);
        res.json({ success: true });
    } catch (error) {
        console.error('Reorder error:', error);
        res.status(500).json({ error: 'Failed to reorder projects' });
    }
});

// POST — admin
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, image, tech, description, live, github, backendGithub, challenges, improvements, featured, order } = req.body;
        if (!name || !image || !tech || !description) {
            return res.status(400).json({ error: 'Required fields missing' });
        }
        const client = await clientPromise;
        const db = client.db('portfolio');
        const result = await db.collection('projects').insertOne({
            name, image, tech, description,
            live: live || '#',
            github: github || '#',
            backendGithub: backendGithub || '',
            challenges: challenges || '', improvements: improvements || '',
            featured: featured || false,
            order: order || 0,
            createdAt: new Date(), updatedAt: new Date(),
        });
        res.status(201).json({ success: true, _id: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// PUT — admin (single update)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, image, tech, description, live, github, backendGithub, challenges, improvements, featured, order } = req.body;
        const client = await clientPromise;
        const db = client.db('portfolio');
        const result = await db.collection('projects').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { name, image, tech, description, live, github, backendGithub: backendGithub || '', challenges, improvements, featured, order: order || 0, updatedAt: new Date() } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update' });
    }
});

// DELETE — admin
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db('portfolio');
        const result = await db.collection('projects').deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

module.exports = router;