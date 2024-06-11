/*
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
*/
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let usersPositions = [];

// Middleware pour parser le JSON dans les requêtes
app.use(express.json());

// Servir les fichiers statiques depuis le répertoire 'public'
app.use(express.static('public'));

// Route API de nettoyage (optionnel)
app.delete('/api/clear', (req, res) => {
    try {
        usersPositions = [];
        res.status(200).send('All positions and users cleared successfully');
    } catch (error) {
        res.status(500).send('Error clearing positions and users');
    }
});

wss.on('connection', (ws) => {
    console.log('New client connected');
    ws.send(JSON.stringify({ type: 'init', usersPositions }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('Received message:', data);

        if (data.type === 'position') {
            const { username, latitude, longitude } = data;
            let userIndex = usersPositions.findIndex(user => user.username === username);

            if (userIndex === -1) {
                usersPositions.push({ username, latitude, longitude, accelerometerData: {} });
                userIndex = usersPositions.length - 1; // Mettre à jour l'index de l'utilisateur
            } else {
                usersPositions[userIndex].latitude = latitude;
                usersPositions[userIndex].longitude = longitude;
            }

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'update', data: { username, latitude, longitude, accelerometerData: usersPositions[userIndex].accelerometerData } }));
                }
            });
        } else if (data.type === 'accelerometer') {
            const { username, x, y, z } = data;
            const userIndex = usersPositions.findIndex(user => user.username === username);

            if (userIndex !== -1) {
                usersPositions[userIndex].accelerometerData = { x, y, z };

                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'update', data: { username, latitude: usersPositions[userIndex].latitude, longitude: usersPositions[userIndex].longitude, accelerometerData: { x, y, z } } }));
                    }
                });
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
