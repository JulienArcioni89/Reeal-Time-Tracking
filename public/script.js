document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('name-form');
    const mapContainer = document.getElementById('map-container');
    const userList = document.getElementById('users');
    let username;
    let map;
    const markers = {};
    const users = {};
    const accelerometerData = {};
    let ws;

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        username = document.getElementById('username').value;
        form.style.display = 'none';
        mapContainer.style.display = 'block';
        initMapAndWebSocket();
    });

    function updateUserList() {
        userList.innerHTML = '';
        for (const user in users) {
            const li = document.createElement('li');
            li.innerHTML = `
                ${user}: ${users[user].latitude.toFixed(5)}, ${users[user].longitude.toFixed(5)}
                <button onclick="requestAccelAccess('${user}')">Activer l'accéléromètre</button>
                <br>
                Accéléromètre: ${accelerometerData[user] ? `x: ${accelerometerData[user].x.toFixed(2)}, y: ${accelerometerData[user].y.toFixed(2)}, z: ${accelerometerData[user].z.toFixed(2)}` : 'N/A'}
            `;
            userList.appendChild(li);
        }
    }

    function initMapAndWebSocket() {
        map = L.map('map').setView([51.505, -0.09], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        ws = new WebSocket('wss://julien.arcioni.caen.mds-project.fr');
        //ws = new WebSocket('ws://localhost:3000');

        ws.onopen = () => {
            if ('geolocation' in navigator) {
                navigator.geolocation.watchPosition((position) => {
                    const { latitude, longitude } = position.coords;
                    if (!markers[username]) {
                        markers[username] = L.marker([latitude, longitude]).addTo(map);
                        markers[username].bindPopup(`Vous êtes ${username}`).openPopup();
                    } else {
                        markers[username].setLatLng([latitude, longitude]);
                    }

                    ws.send(JSON.stringify({ username, latitude, longitude }));

                    users[username] = { latitude, longitude };
                    updateUserList();
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
                data.usersPositions.forEach(user => {
                    if (user.username !== username) {
                        markers[user.username] = L.marker([user.latitude, user.longitude]).addTo(map);
                        markers[user.username].bindPopup(user.username).openPopup();
                        users[user.username] = { latitude: user.latitude, longitude: user.longitude };
                        accelerometerData[user.username] = user.accelerometerData || {};
                    }
                });
                updateUserList();
            } else if (data.type === 'update') {
                const { username: user, latitude, longitude, accelerometerData: accelData } = data.data;
                if (user !== username) {
                    if (!markers[user]) {
                        markers[user] = L.marker([latitude, longitude]).addTo(map);
                        markers[user].bindPopup(user).openPopup();
                    } else {
                        markers[user].setLatLng([latitude, longitude]);
                    }
                    users[user] = { latitude, longitude };
                    accelerometerData[user] = accelData || {};
                    updateUserList();
                }
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    window.requestAccelAccess = function (user) {
        if (user === username) {
            if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
                DeviceMotionEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            window.addEventListener('devicemotion', (event) => {
                                const { acceleration } = event;
                                if (acceleration) {
                                    const { x, y, z } = acceleration;
                                    ws.send(JSON.stringify({ type: 'accelerometer', username, x, y, z }));
                                }
                            });
                        }
                    })
                    .catch(console.error);
            } else {
                console.warn('DeviceMotionEvent.requestPermission is not supported.');
            }
        }
    };
});
