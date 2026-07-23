require('dotenv').config();
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function reset() {
    const client = new MongoClient(process.env.MONGO_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('portfolio');
        const hash = await bcrypt.hash('mehedy11093950@M', 12);

        const result = await db.collection('admin').updateOne(
            { username: 'mehedy.PUST' },
            { $set: { passwordHash: hash, updatedAt: new Date() } },
            { upsert: true }
        );

        console.log('Password reset!');
        console.log('Matched:', result.matchedCount);
        console.log('Modified:', result.modifiedCount);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.close();
    }
}

reset();