const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Sanitize inputs
        const sanitizedName = name.replace(/<[^>]*>/g, '').trim();
        const sanitizedEmail = email.replace(/<[^>]*>/g, '').trim();
        const sanitizedMessage = message.replace(/<[^>]*>/g, '').trim();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 1. Send notification to admin (you)
        const adminMailOptions = {
            from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `New message from ${sanitizedName}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #065f46;">📬 New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold; color: #374151;">Name:</td><td style="padding: 8px; color: #374151;">${sanitizedName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; color: #374151;">Email:</td><td style="padding: 8px; color: #374151;">${sanitizedEmail}</td></tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
            <p style="font-weight: bold; color: #374151;">Message:</p>
            <p style="color: #4b5563;">${sanitizedMessage}</p>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">Sent from your portfolio contact form</p>
        </div>
      `,
        };

        // 2. Send greeting/reply to the person who submitted
        const userMailOptions = {
            from: `"Mehedy Hasan" <${process.env.EMAIL_USER}>`,
            to: sanitizedEmail,
            subject: `Thank you for reaching out, ${sanitizedName}!`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #f0fdf4; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #065f46; margin: 0;">👋 Hello, ${sanitizedName}!</h1>
          </div>
          
          <div style="background-color: white; padding: 24px; border-radius: 10px; border: 1px solid #d1fae5;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Thank you for reaching out through my portfolio website. I have received your message and will get back to you as soon as possible.
            </p>
            
            <div style="margin: 20px 0; padding: 16px; background-color: #f9fafb; border-left: 4px solid #f59e0b; border-radius: 4px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                <strong>Your message:</strong><br/>
                "${sanitizedMessage.slice(0, 200)}${sanitizedMessage.length > 200 ? '...' : ''}"
              </p>
            </div>
            
            <p style="color: #374151; font-size: 14px;">
              I typically respond within 24-48 hours. In the meantime, feel free to:
            </p>
            <ul style="color: #374151; font-size: 14px;">
              <li>Check out my <a href="https://mehedy-pust.vercel.app/projects" style="color: #059669;">projects</a></li>
              <li>Connect with me on <a href="https://linkedin.com/in/mehedy-hasan" style="color: #059669;">LinkedIn</a></li>
              <li>View my <a href="https://github.com/mehedyPUST" style="color: #059669;">GitHub</a></li>
            </ul>
          </div>
          
          <div style="margin-top: 24px; text-align: center;">
            <p style="color: #374151; font-size: 16px; font-weight: 600; margin-bottom: 4px;">Best regards,</p>
            <p style="color: #065f46; font-size: 18px; font-weight: bold; margin: 0;">Mehedy Hasan</p>
            <p style="color: #6b7280; font-size: 14px; margin: 4px 0;">Full‑Stack Developer | Physics Researcher</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 8px 0;">
              📧 ${process.env.EMAIL_USER} | 🌐 <a href="https://mehedy-pust.vercel.app" style="color: #059669;">mehedy-pust.vercel.app</a>
            </p>
          </div>
        </div>
      `,
        };

        // Send both emails
        await Promise.all([
            transporter.sendMail(adminMailOptions),
            transporter.sendMail(userMailOptions),
        ]);

        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

module.exports = router;