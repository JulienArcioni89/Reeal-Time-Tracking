const { MongoClient } = require('mongodb');
require('dotenv').config();

const url = process.env.MONGODB_URL;

async function connectDB() {
    try {
        const client = new MongoClient(url, { useUnifiedTopology: true });
        await client.connect();
        console.log('Connexion à la base de données réussie');
        // Utiliser le nom de la base de données spécifiée dans l'URL
        const dbName = url.split('/').pop().split('?')[0];
        return client.db(dbName);
    } catch (error) {
        console.error('Erreur lors de la connexion à la base de données :', error);
        throw error;
    }
}

module.exports = connectDB;
