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

wss.on('connection', (ws) => {
    let currentUsername = null;

    ws.send(JSON.stringify({ type: 'init', usersPositions }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'position') {
            const userIndex = usersPositions.findIndex(user => user.username === data.username);
            if (userIndex === -1) {
                usersPositions.push({ ...data, accelerometerData: {} });
            } else {
                usersPositions[userIndex] = { ...data, accelerometerData: usersPositions[userIndex].accelerometerData };
            }

            currentUsername = data.username;

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
        if (currentUsername) {
            usersPositions = usersPositions.filter(user => user.username !== currentUsername);

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
