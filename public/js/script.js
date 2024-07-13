const socket = io()
const userForm = document.getElementById('userForm');
const mapDiv = document.getElementById('map');
const form = document.getElementById('form');

let user = {name: '', gender: ''};

form.addEventListener('submit', (e) => {
    e.preventDefault();
    user.name = form.name.value;
    user.gender = form.gender.value;
    userForm.style.display = 'none';
    mapDiv.style.display = 'block';
    initializeMap();
});

function initializeMap() {
    if(navigator.geolocation){
        navigator.geolocation.watchPosition((position) =>{
            const {latitude, longitude}= position.coords;
            socket.emit("send-location", {latitude, longitude, ...user});
        }, 
        (error)=>{
            console.log(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
    
    const map = L.map("map").setView([0,0], 16)
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "Ankit"
    }).addTo(map)
    
    const boyIcon = L.icon({
        iconUrl: 'icons/boy.png', 
        iconSize: [38, 38],
    });
    
    const girlIcon = L.icon({
        iconUrl: '/icons/girl.png', 
        iconSize: [38, 38],
    });
    
    const markers = {};
    
    socket.on("receive-location", (data) => {
        const {id, latitude, longitude, name, gender} = data;
        map.setView([latitude, longitude]);
    
        let markerIcon = gender === 'boy' ? boyIcon : girlIcon;
    
        if(markers[id]){
            markers[id].setLatLng([latitude, longitude]);
        }
        else{
            markers[id] = L.marker([latitude,longitude], { icon: markerIcon})
            .addTo(map)
            .bindPopup(`<b>${name}</b>`)
            .on('click', () => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((position) => {
                        const user_lat_lng = [position.coords.latitude, position.coords.longitude];
                        const destination_lat_lng = [latitude, longitude];
                        L.Routing.control({
                            waypoints: [
                                L.latLng(user_lat_lng),
                                L.latLng(destination_lat_lng)
                            ],
                            routeWhileDragging: true
                        }).addTo(map);
                    });
                }
            });
        }
    });
}



socket.on("user-disconnected", (id) => {
    if (markers[id]){
        map.removeLayer(markers[id]);
        delete markers[id];
    }
})

userForm.style.display = 'block';
mapDiv.style.display = 'none';