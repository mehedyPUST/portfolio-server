const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Optional: store contact messages in MongoDB
// const clientPromise = require('../db');

router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Sanitize inputs (basic)
        const sanitizedName = name.replace(/<[^>]*>/g, '').trim();
        const sanitizedEmail = email.replace(/<[^>]*>/g, '').trim();
        const sanitizedMessage = message.replace(/<[^>]*>/g, '').trim();

        // --- Send email using Nodemailer ---
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // sends to yourself
            subject: `New message from ${sanitizedName}`,
            html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${sanitizedName}</p>
        <p><strong>Email:</strong> ${sanitizedEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${sanitizedMessage}</p>
      `,
        };

        await transporter.sendMail(mailOptions);

        // --- Optional: Store in MongoDB ---
        // const client = await clientPromise;
        // const db = client.db('portfolio');
        // await db.collection('contacts').insertOne({
        //   name: sanitizedName,
        //   email: sanitizedEmail,
        //   message: sanitizedMessage,
        //   createdAt: new Date(),
        // });

        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

module.exports = router;