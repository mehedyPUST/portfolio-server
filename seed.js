require('dotenv').config();
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function seed() {
    const client = new MongoClient(process.env.MONGO_URI);

    try {
        await client.connect();
        const db = client.db('portfolio');

        // Check if admin already exists
        const existing = await db.collection('admin').findOne({ username: process.env.ADMIN_USERNAME });

        if (existing) {
            console.log('Admin already exists');
            return;
        }

        // Create admin
        const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

        await db.collection('admin').insertOne({
            username: process.env.ADMIN_USERNAME,
            passwordHash,
            createdAt: new Date(),
        });

        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await client.close();
    }
}

seed();