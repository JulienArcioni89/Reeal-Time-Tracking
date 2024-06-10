const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const connectDB = require('./database');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let usersPositions = [];

// Middleware pour parser le JSON dans les requêtes
app.use(express.json());

// Servir les fichiers statiques depuis le répertoire 'public'
app.use(express.static('public'));

// Connect to the database
connectDB().then(db => {
    // Passer la référence de la base de données à l'API Router
    const apiRouter = require('./routes/api')(db, usersPositions);
    app.use('/api', apiRouter);

    wss.on('connection', (ws) => {
        // Envoyer les positions des utilisateurs connectés au nouveau client
        ws.send(JSON.stringify({ type: 'init', usersPositions }));

        ws.on('message', async (message) => {
            const data = JSON.parse(message);
            const collection = db.collection('positions');
            await collection.insertOne(data);

            // Mettre à jour la position de l'utilisateur dans la liste
            const userIndex = usersPositions.findIndex(user => user.username === data.username);
            if (userIndex === -1) {
                usersPositions.push(data);
            } else {
                usersPositions[userIndex] = data;
            }

            // Envoyer la mise à jour de la position à tous les clients connectés
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'update', data }));
                }
            });
        });

        ws.on('close', () => {
            // Optionnel : gérer la déconnexion de l'utilisateur et retirer sa position de la liste
        });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Failed to connect to the database', error);
});
