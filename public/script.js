document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('name-form');
    const mapContainer = document.getElementById('map-container');
    const videoContainer = document.getElementById('video-container');
    const userList = document.getElementById('users');
    let username;
    let map;
    const markers = {};
    const users = {};
    const config = {
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302"
            }
        ]
    };
    let localStream;

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        username = document.getElementById('username').value;
        form.style.display = 'none';
        mapContainer.style.display = 'block';
        videoContainer.style.display = 'block';
        initMapAndWebRTC();
    });

    function updateUserList() {
        userList.innerHTML = '';
        for (const user in users) {
            const li = document.createElement('li');
            li.textContent = `${user}: ${users[user].latitude.toFixed(5)}, ${users[user].longitude.toFixed(5)}`;
            userList.appendChild(li);
        }
    }

    function initMapAndWebRTC() {
        map = L.map('map').setView([51.505, -0.09], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const ws = new WebSocket('ws://localhost:3000');
        //const ws = new WebSocket('wss://julien.arcioni.caen.mds-project.fr');


        ws.onopen = () => {
            if ('geolocation' in navigator) {
                navigator.geolocation.watchPosition((position) => {
                    const { latitude, longitude } = position.coords;
                    if (!markers[username]) {
                        markers[username] = L.marker([latitude, longitude]).addTo(map);
                        markers[username].bindPopup(`Vous : ${username}`).openPopup();
                    } else {
                        markers[username].setLatLng([latitude, longitude]);
                    }

                    ws.send(JSON.stringify({ username, latitude, longitude }));

                    // Mettre à jour l'utilisateur dans la liste
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
                // Initialiser les positions des utilisateurs connectés
                data.usersPositions.forEach(user => {
                    if (user.username !== username) {
                        markers[user.username] = L.marker([user.latitude, user.longitude]).addTo(map);
                        markers[user.username].bindPopup(user.username).openPopup();
                        users[user.username] = { latitude: user.latitude, longitude: user.longitude };
                    }
                });
                updateUserList();
            } else if (data.type === 'update') {
                const { username: user, latitude, longitude } = data.data;
                if (user !== username) {
                    if (!markers[user]) {
                        markers[user] = L.marker([latitude, longitude]).addTo(map);
                        markers[user].bindPopup(user).openPopup();
                    } else {
                        markers[user].setLatLng([latitude, longitude]);
                    }
                    // Mettre à jour l'utilisateur dans la liste
                    users[user] = { latitude, longitude };
                    updateUserList();
                }
            } else if (data.type === 'remove') {
                const user = data.username;
                if (markers[user]) {
                    map.removeLayer(markers[user]);
                    delete markers[user];
                }
                delete users[user];
                updateUserList();
            }
        };

        // Initialiser WebRTC
        const localVideo = document.getElementById('local-video');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('getUserMedia is not supported by this browser');
            return;
        }
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localVideo.srcObject = stream;
                // Logique pour établir la connexion WebRTC
            })
            .catch(err => console.error('Error accessing media devices.', err));
    }
});