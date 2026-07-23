const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const clientPromise = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const client = await clientPromise;
        const db = client.db('portfolio');
        const admin = await db.collection('admin').findOne({ username });

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'JWT_SECRET not configured on server' });
        }

        const isMatch = await bcrypt.compare(password, admin.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { username: admin.username, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set cookie — cross-site compatible
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/',
        });

        res.json({ success: true, message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            details: error.message,
        });
    }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
    res.clearCookie('admin_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
    });
    res.json({ success: true, message: 'Logged out' });
});

// GET /api/admin/verify
router.get('/verify', authMiddleware, (req, res) => {
    res.json({ authenticated: true, username: req.admin.username });
});

module.exports = router;