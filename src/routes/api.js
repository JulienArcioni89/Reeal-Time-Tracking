const express = require('express');

module.exports = (db, usersPositions) => {
    const router = express.Router();

    router.post('/position', (req, res) => {
        const { username, latitude, longitude } = req.body;
        const positionCollection = db.collection('positions');
        const userCollection = db.collection('users');

        userCollection.updateOne(
            { username },
            { $set: { username, latitude, longitude } },
            { upsert: true }
        ).then(() => {
            return positionCollection.insertOne({ username, latitude, longitude });
        }).then(() => {
            // Mettre à jour la position de l'utilisateur dans la liste
            const userIndex = usersPositions.findIndex(user => user.username === username);
            if (userIndex === -1) {
                usersPositions.push({ username, latitude, longitude });
            } else {
                usersPositions[userIndex] = { username, latitude, longitude };
            }
            res.status(200).send('Position stored successfully');
        }).catch((err) => {
            res.status(500).send('Error storing position');
        });
    });

    // Route pour supprimer toutes les entrées dans les collections positions et users
    router.delete('/clear', async (req, res) => {
        try {
            await db.collection('positions').deleteMany({});
            await db.collection('users').deleteMany({});
            // Vider la liste des positions des utilisateurs connectés
            usersPositions.length = 0;
            res.status(200).send('All positions and users deleted successfully');
        } catch (error) {
            res.status(500).send('Error clearing positions and users');
        }
    });

    return router;
};
