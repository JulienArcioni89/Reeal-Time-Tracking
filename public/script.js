document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('name-form');
    const mapContainer = document.getElementById('map');
    const videoContainer = document.getElementById('video-container');
    let username;
    let map;
    const markers = {};

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        username = document.getElementById('username').value;
        form.style.display = 'none';
        mapContainer.style.display = 'block';
        videoContainer.style.display = 'block';
        initMapAndWebRTC();
    });

    function initMapAndWebRTC() {
        map = L.map('map').setView([51.505, -0.09], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const ws = new WebSocket('ws://localhost:3000');

        ws.onopen = () => {
            if ('geolocation' in navigator) {
                navigator.geolocation.watchPosition((position) => {
                    const { latitude, longitude } = position.coords;
                    if (!markers[username]) {
                        markers[username] = L.marker([latitude, longitude]).addTo(map);
                        markers[username].bindPopup(`You are ${username}`).openPopup();
                    } else {
                        markers[username].setLatLng([latitude, longitude]);
                    }

                    ws.send(JSON.stringify({ username, latitude, longitude }));

                    fetch('/api/position', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, latitude, longitude })
                    }).catch(err => console.error('Error sending position:', err));
                }, (err) => {
                    console.error('Error getting geolocation:', err);
                }, {
                    enableHighAccuracy: true
                });
            } else {
                console.error('Geolocation is not supported by this browser.');
            }
        };

        ws.onmessage = (message) => {
            const data = JSON.parse(message.data);
            if (data.type === 'init') {
                // Initialiser les positions des utilisateurs connectés
                data.usersPositions.forEach(user => {
                    if (user.username !== username) {
                        markers[user.username] = L.marker([user.latitude, user.longitude]).addTo(map);
                        markers[user.username].bindPopup(user.username).openPopup();
                    }
                });
            } else if (data.type === 'update') {
                const { username: user, latitude, longitude } = data.data;
                if (user !== username) {
                    if (!markers[user]) {
                        markers[user] = L.marker([latitude, longitude]).addTo(map);
                        markers[user].bindPopup(user).openPopup();
                    } else {
                        markers[user].setLatLng([latitude, longitude]);
                    }
                }
            }
        };

        // Initialiser WebRTC
        const localVideo = document.getElementById('local-video');
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localVideo.srcObject = stream;
                // Logique pour établir la connexion WebRTC
            })
            .catch(err => console.error('Error accessing media devices.', err));
    }
});
