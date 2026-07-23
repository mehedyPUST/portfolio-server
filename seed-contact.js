require('dotenv').config();
const { MongoClient } = require('mongodb');

async function seed() {
    const client = new MongoClient(process.env.MONGO_URI);

    try {
        await client.connect();
        const db = client.db('portfolio');

        await db.collection('contact_info').updateOne(
            {},
            {
                $set: {
                    email: 'mehedy.hasan@example.com',
                    phone: '+880 1XXX-XXXXXX',
                    whatsapp: '+880 1XXX-XXXXXX',
                    github: 'https://github.com/mehedyPUST',
                    linkedin: 'https://linkedin.com/in/mehedy-hasan',
                    facebook: 'https://facebook.com/mehedy.hasan',
                    location: 'Pabna, Bangladesh',
                    portfolio: 'https://mehedy-pust.vercel.app',
                    updatedAt: new Date(),
                },
            },
            { upsert: true }
        );

        console.log('Contact info seeded successfully!');
    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await client.close();
    }
}

seed();