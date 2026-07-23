const express = require('express');
const { ObjectId } = require('mongodb');
const clientPromise = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// GET /api/projects — public, returns all projects
router.get('/', async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db('portfolio');
        const projects = await db
            .collection('projects')
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// GET /api/projects/featured — public, returns 3 featured
router.get('/featured', async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db('portfolio');
        const projects = await db
            .collection('projects')
            .find({ featured: true })
            .sort({ createdAt: -1 })
            .limit(3)
            .toArray();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch featured projects' });
    }
});

// POST /api/projects (protected)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, image, tech, description, live, github, challenges, improvements, featured } = req.body;

        if (!name || !image || !tech || !description) {
            return res.status(400).json({ error: 'Name, image, tech, and description are required' });
        }

        const client = await clientPromise;
        const db = client.db('portfolio');

        const project = {
            name,
            image,
            tech,
            description,
            live: live || '#',
            github: github || '#',
            challenges: challenges || '',
            improvements: improvements || '',
            featured: featured || false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('projects').insertOne(project);
        res.status(201).json({ success: true, project: { ...project, _id: result.insertedId } });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// PUT /api/projects/:id (protected)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image, tech, description, live, github, challenges, improvements, featured } = req.body;

        const client = await clientPromise;
        const db = client.db('portfolio');

        const updateData = {
            name,
            image,
            tech,
            description,
            live: live || '#',
            github: github || '#',
            challenges: challenges || '',
            improvements: improvements || '',
            featured: featured || false,
            updatedAt: new Date(),
        };

        const result = await db
            .collection('projects')
            .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ success: true, message: 'Project updated' });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE /api/projects/:id (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const client = await clientPromise;
        const db = client.db('portfolio');

        const result = await db.collection('projects').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

module.exports = router;