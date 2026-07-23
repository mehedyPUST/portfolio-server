const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// POST /api/upload (protected) — upload image to ImgBB
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { image } = req.body; // base64 string

        if (!image) {
            return res.status(400).json({ error: 'Image data required' });
        }

        // Remove data:image/...;base64, prefix if present
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

        const formData = new URLSearchParams();
        formData.append('key', process.env.IMGBB_API_KEY);
        formData.append('image', base64Data);

        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            res.json({
                success: true,
                url: result.data.url,
                display_url: result.data.display_url,
                delete_url: result.data.delete_url,
            });
        } else {
            res.status(400).json({ error: 'Upload failed', details: result });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

module.exports = router;