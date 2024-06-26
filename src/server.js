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
        let currentUsername = null;

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

            currentUsername = data.username; // Assigner le nom d'utilisateur actuel

            // Envoyer la mise à jour de la position à tous les clients connectés
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'update', data }));
                }
            });
        });

        ws.on('close', () => {
            // Supprimer l'utilisateur de la liste lorsqu'il se déconnecte
            if (currentUsername) {
                usersPositions = usersPositions.filter(user => user.username !== currentUsername);

                // Informer les autres clients de la suppression de l'utilisateur
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'remove', username: currentUsername }));
                    }
                });
            }
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
        let currentUsername = null;

        // Envoyer les positions des utilisateurs connectés au nouveau client
        ws.send(JSON.stringify({ type: 'init', usersPositions }));

        ws.on('message', async (message) => {
            const data = JSON.parse(message);
            const collection = db.collection('positions');

            if (data.type === 'position') {
                await collection.insertOne(data);

                // Mettre à jour la position de l'utilisateur dans la liste
                const userIndex = usersPositions.findIndex(user => user.username === data.username);
                if (userIndex === -1) {
                    usersPositions.push({ ...data, accelerometerData: {} });
                } else {
                    usersPositions[userIndex] = { ...data, accelerometerData: usersPositions[userIndex].accelerometerData };
                }

                currentUsername = data.username;

                // Envoyer la mise à jour de la position à tous les clients connectés
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'update', data }));
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
            // Supprimer l'utilisateur de la liste lorsqu'il se déconnecte
            if (currentUsername) {
                usersPositions = usersPositions.filter(user => user.username !== currentUsername);

                // Informer les autres clients de la suppression de l'utilisateur
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'remove', username: currentUsername }));
                    }
                });
            }
        });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Failed to connect to the database', error);
});
