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

// POST — admin
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, image, tech, description, live, github, challenges, improvements, featured, order } = req.body;
        if (!name || !image || !tech || !description) {
            return res.status(400).json({ error: 'Required fields missing' });
        }
        const client = await clientPromise;
        const db = client.db('portfolio');
        const result = await db.collection('projects').insertOne({
            name, image, tech, description,
            live: live || '#', github: github || '#',
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

// PUT — admin
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, image, tech, description, live, github, challenges, improvements, featured, order } = req.body;
        const client = await clientPromise;
        const db = client.db('portfolio');
        const result = await db.collection('projects').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { name, image, tech, description, live, github, challenges, improvements, featured, order: order || 0, updatedAt: new Date() } }
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