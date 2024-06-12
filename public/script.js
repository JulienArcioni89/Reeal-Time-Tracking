document.addEventListener('DOMContentLoaded', () => {
    // Déclaration des variables et initialisation des éléments du DOM
    const form = document.getElementById('name-form');
    const mapContainer = document.getElementById('map-container');
    const videoContainer = document.getElementById('video-container');
    const userList = document.getElementById('users');
    let username;
    let map;
    const markers = {};
    const users = {};
    const accelerometerData = {};
    let ws;
    let lastAccelSendTime = 0;
    let peerConnection;
    // Temporiser l'envoi des données toutes les 6 secondes
    const accelSendInterval = 6000;

    // Gestionnaire d'événements pour le formulaire
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        username = document.getElementById('username').value;
        form.style.display = 'none';
        mapContainer.style.display = 'block';
        videoContainer.style.display = 'block';
        initMapAndWebSocket();
    });

    // Fonction pour mettre à jour la liste des utilisateurs connectés
    function updateUserList() {
        userList.innerHTML = '';
        for (const user in users) {
            const latitude = users[user].latitude;
            const longitude = users[user].longitude;
            const accelData = accelerometerData[user];
            const accelText = accelData ? `x: ${accelData.x?.toFixed(2) || 'N/A'}, y: ${accelData.y?.toFixed(2) || 'N/A'}, z: ${accelData.z?.toFixed(2) || 'N/A'}` : 'N/A';

            const li = document.createElement('li');
            li.innerHTML = `
                ${user}: ${latitude !== undefined ? latitude.toFixed(5) : 'N/A'}, ${longitude !== undefined ? longitude.toFixed(5) : 'N/A'}
                <button class="accelerometer" onclick="requestAccelAccess('${user}')">Activer l'accéléromètre</button>
<!--                ADD HERE-->
                <button class="call-button" id="${user}-call-button">Appeler</button>
                <br>
                Accéléromètre: ${accelText}
            `;
            userList.appendChild(li);

            // Gestionnaire d'événements pour le bouton d'appel
            document.getElementById(`${user}-call-button`).addEventListener('click', () => {
                initWebRTC(user);
            });
        }
    }

/*    function initWebRTC(user) {
        const localVideo = document.getElementById('local-video');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('getUserMedia is not supported by this browser');
            return;
        }
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localVideo.srcObject = stream;
                // Logique pour établir la connexion WebRTC avec l'utilisateur spécifié
            })
            .catch(err => console.error('Error accessing media devices.', err));
    }*/

    // Fonction pour initialiser la carte et la connexion WebSocket
    function initMapAndWebSocket() {
        map = L.map('map').setView([51.505, -0.09], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Initialiser la connexion WebSocket
        ws = new WebSocket('wss://julien.arcioni.caen.mds-project.fr');

        // Gestion des événements WebSocket
        // Envoi de la position de l'utilisateur au serveur
        ws.onopen = () => {
            if ('geolocation' in navigator) {
                navigator.geolocation.watchPosition((position) => {
                    const { latitude, longitude } = position.coords;
                    // Mettre à jour la position de l'utilisateur sur la carte
                    if (!markers[username]) {
                        markers[username] = L.marker([latitude, longitude]).addTo(map);
                        markers[username].bindPopup(`Vous êtes ${username}`).openPopup();
                    } else {
                        markers[username].setLatLng([latitude, longitude]);
                    }

                    // Envoyer la position de l'utilisateur au serveur
                    ws.send(JSON.stringify({ type: 'position', username, latitude, longitude }));

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

        // Réception des messages du serveur
        ws.onmessage = (message) => {
            const data = JSON.parse(message.data);
            if (data.type === 'init') {
                // Initialiser les positions des utilisateurs connectés
                data.usersPositions.forEach(user => {
                    if (user.username !== username) {
                        markers[user.username] = L.marker([user.latitude, user.longitude]).addTo(map);
                        markers[user.username].bindPopup(user.username).openPopup();
                        users[user.username] = { latitude: user.latitude, longitude: user.longitude };
                        accelerometerData[user.username] = user.accelerometerData || {};
                    }
                });
                updateUserList();
                // Demander l'accès à l'accéléromètre
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
                // Supprimer l'utilisateur de la carte
            } else if (data.type === 'remove') {
                const user = data.username;
                if (markers[user]) {
                    map.removeLayer(markers[user]);
                    delete markers[user];
                }
                delete users[user];
                updateUserList();
            }

            // Logique pour gérer les appels WebRTC
            if (data.type === 'offer') {
                // Lorsque vous recevez une offre, demandez à l'utilisateur s'il souhaite accepter l'appel
                const acceptCall = window.confirm(`Appel entrant de ${data.source}. Accepter l'appel ?`);
                if (acceptCall) {
                    // Si l'utilisateur accepte l'appel, créez une réponse et envoyez-la
                    peerConnection.setRemoteDescription(data.offer)
                        .then(() => peerConnection.createAnswer())
                        .then(answer => peerConnection.setLocalDescription(answer))
                        .then(() => {
                            ws.send(JSON.stringify({ type: 'answer', target: data.source, answer: peerConnection.localDescription }));
                        });
                }
            } else if (data.type === 'answer') {
                // Lorsque vous recevez une réponse, définissez-la comme description distante
                peerConnection.setRemoteDescription(data.answer);
            } else if (data.type === 'icecandidate') {
                // Lorsque vous recevez un candidat ICE, ajoutez-le à la RTCPeerConnection
                const candidate = new RTCIceCandidate(data.candidate);
                peerConnection.addIceCandidate(candidate);
            }
        };

        // Gestion des erreurs WebSocket
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        window.requestAccelAccess = function (user) {
            if (user === username) {
                if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
                    DeviceMotionEvent.requestPermission()
                        // Autoriser l'accès à l'accéléromètre
                        .then(permissionState => {
                            if (permissionState === 'granted') {
                                window.addEventListener('devicemotion', (event) => {
                                    const { acceleration } = event;
                                    if (acceleration) {
                                        const { x, y, z } = acceleration;
                                        const currentTime = Date.now();
                                        // Envoyer les données de l'accéléromètre au serveur
                                        if (currentTime - lastAccelSendTime > accelSendInterval) {
                                            lastAccelSendTime = currentTime;
                                            ws.send(JSON.stringify({ type: 'accelerometer', username, x, y, z }));
                                        }
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
    }

    function initWebRTC(user) {
        const localVideo = document.getElementById('local-video');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('getUserMedia is not supported by this browser');
            return;
        }
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localVideo.srcObject = stream;

                // Créer une instance de RTCPeerConnection
                peerConnection = new RTCPeerConnection();

                // Ajouter le flux local à la RTCPeerConnection
                stream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, stream);
                });

                // Écouter l'événement 'icecandidate'
                peerConnection.onicecandidate = event => {
                    if (event.candidate) {
                        // Envoyer le candidat ICE à l'autre utilisateur
                        ws.send(JSON.stringify({ type: 'icecandidate', target: user, candidate: event.candidate }));
                    }
                };

                // Créer une offre SDP et l'envoyer à l'autre utilisateur
                peerConnection.createOffer()
                    .then(offer => peerConnection.setLocalDescription(offer))
                    .then(() => {
                        ws.send(JSON.stringify({ type: 'offer', target: user, offer: peerConnection.localDescription }));
                    });
            })
            .catch(err => console.error('Error accessing media devices.', err));
    }
});
