"use client"; // This is a client component
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const MapComponent = () => {
    const [map, setMap] = useState(null);
    const isMobile = window.innerWidth <= 768;
    const antialias = isMobile ? false : true;
    const [places, setPlaces] = useState([]);
    const [messages, setMessages] = useState("");
    const [prompt, setPrompt] = useState('');
    const [location, setLocation] = useState([]);
    const [type, setType] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => { }, [prompt, location, type]);

    const getPlaceDetails = async (locationValue) => {
        setLoading(true);
        try {
            const placesResponse = await fetch('/api/getPlaces', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Assuming location is an object with lat and lng properties
                body: JSON.stringify({ location: location, locationValue: locationValue })
            });

            if (!placesResponse.ok) {
                throw new Error(`HTTP error! Status: ${placesResponse.status}`);
            }
            const placesData = await placesResponse.json();
            setPlaces(placesData);
            // Assuming placesData is an array of place objects
            if (placesData.length > 0) {
                getSummary(JSON.stringify(placesData))

            }
        } catch (error) {
            console.error('Failed to fetch places:', error.message);
        }
    };

    const setUserLocation = async () => {
        try {
            const placesResponse = await fetch('/api/setLocation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Assuming location is an object with lat and lng properties
                body: JSON.stringify(prompt)
            });

            if (!placesResponse.ok) {
                throw new Error(`HTTP error! Status: ${placesResponse.status}`);
            }
            const placesData = await placesResponse.json();
            getSummary(prompt)
            setLocation(placesData);
            console.log("Location:_" + JSON.stringify(placesData))
            map.flyTo({
                center: [placesData[1], placesData[0]], // The clicked coordinates
                zoom: 12.35, // Zoom level 0 (zoomed all the way out) to 24 (zoomed all the way in)
                speed: 0.5, // Optional speed of the transition
                pitch: 60, // Optional pitch of the camera angle
                bearing: Math.random() * 10, // Optional bearing of the transition
            });
            // Create a new marker and add it to the map
            setTimeout(() => {
                new mapboxgl.Marker({
                    draggable: true // Marker is draggable
                })
                    .setLngLat([placesData[1], placesData[0]])
                    .addTo(map);
            }, 1000);
            // Assuming placesData is an array of place objects
           
        } catch (error) {
            console.error('Failed to fetch places:', error.message);
        }
    };

    const getSummary = async (places) => {
        try {
            const response = await fetch('/api/sendMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify("Give me a very brief summary of the following places. No need to list all the details, just enough to give me an idea of the types or category: " + places) // Ensure that the API expects this format
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            const content = data.choices[0].message.content;
            setMessages(content);
            setLoading(false);
            console.log(content);
        } catch (error) {
            console.error('Failed to send message:', error);
            // This should log any error, including those without a message property
            alert('Failed to send message: ' + (error.message || error.toString()));
        }
    };

    const sendMessage = async () => {
        setLoading(true);
        const message = prompt + ' location:' + location
        try {
            const response = await fetch('/api/sendMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            console.log("Data:_" + JSON.stringify(data))
            setMessages(data.choices[0].message.content);
            setLoading(false);
            const toolCall = data.choices[0].message.tool_calls[0];

            if (toolCall.type === 'function') {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);

                // Check for 'map_annotations' and handle it
                if (functionName === 'map_annotations') {
                    const categoryValue = functionArgs.category;
                    if (categoryValue) {
                        getPlaceDetails(categoryValue);
                    } else {
                        alert('Category value is undefined');
                    }
                }
                // Check for 'set_location' and handle it
                else if (functionName === 'set_location') {
                    const locationValue = functionArgs.location;
                    setUserLocation();
                } else {
                    alert('Function not recognized');
                }
            }



        } catch (error) {
            console.error('Failed to send message:', error.message);
        }
    };

    useEffect(() => {
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX;
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = [position.coords.longitude, position.coords.latitude];
            setLocation([position.coords.latitude, position.coords.longitude])
            // Initialize a map instance
            if (userLocation.every(coord => !isNaN(coord))) {
                const mapInstance = new mapboxgl.Map({
                    container: 'map',
                    style: 'mapbox://styles/aaronbesson/clm0j2cas01v801p968g7gvst',
                    center: location.length === 0 ? userLocation : [location[1], location[0]], // center the map on the user's current position
                    zoom: 10,
                    maxZoom: 20,
                    pitch: 17,
                    bearing: 0,
                    quality: 'high',
                });
                setMap(mapInstance); // Save the map instance to state


                mapInstance.on('load', () => {

                    mapInstance.flyTo({
                        center: [location[1], location[0]], // The clicked coordinates
                        zoom: 12.35, // Zoom level 0 (zoomed all the way out) to 24 (zoomed all the way in)
                        speed: 0.5, // Optional speed of the transition
                        pitch: 60, // Optional pitch of the camera angle
                        bearing: Math.random() * 10, // Optional bearing of the transition
                    });
                    mapInstance.addControl(
                        new mapboxgl.FullscreenControl({
                            container: document.querySelector('body')
                        })
                    );
                    mapInstance.addControl(
                        new mapboxgl.NavigationControl({
                            visualizePitch: true
                        })
                    );

                    places && places.forEach((place) => {
                        const { lat, lng } = place.geometry.location;
                        const markerElement = document.createElement('div');
                        markerElement.className = 'custom-marker';
                        markerElement.innerHTML = `<img src="${place.icon}" alt="${place.name}" width="30" height="30"/>`;

                        const popup = new mapboxgl.Popup({ offset: 25 })
                            .setHTML(`<strong>${place.name}</strong><p>${place.vicinity}</p>`);

                        new mapboxgl.Marker(markerElement)
                            .setLngLat([lng, lat])
                            .setPopup(popup)
                            .addTo(mapInstance);
                    });

                });
                let userMarker; // Declare userMarker in the higher scope

                navigator.geolocation.getCurrentPosition((position) => {
                    // Define userMarker with the initial position
                    userMarker = new mapboxgl.Marker({
                        draggable: true // Make sure the marker is draggable
                    })
                        .setLngLat([position.coords.longitude, position.coords.latitude])
                        .addTo(mapInstance);

                    // Listen for dragend event on the marker
                    userMarker.on('dragend', onDragEnd);
                });

                // Add click event to the map
                mapInstance.on('click', (e) => {
                    if (!userMarker) {
                        // Initialize userMarker if it hasn't been created yet
                        userMarker = new mapboxgl.Marker({
                            draggable: true
                        }).setLngLat(e.lngLat).addTo(mapInstance);
                    } else {
                        // Update the marker's position to the clicked location
                        userMarker.setLngLat(e.lngLat);
                    }
                    // Update your location state if necessary
                    setLocation([e.lngLat.lat, e.lngLat.lng]);
                });


            }
        }, (error) => {
            console.error('An error occurred while retrieving location', error);
        });

        return () => map && map.remove();
    }, [places]);

    function onDragEnd() {
        const lngLat = userMarker.getLngLat();
        setLocation([lngLat.lat, lngLat.lng]);
        // Perform other actions needed after dragging the marker
    }

    return (<div className="flex w-full h-screen text-black">
        <div className="flex flex-col w-1/2 h-full bg-white justify-center p-12">
            <h1 className="text-4xl font-bold text-left mx-4">Wonder Map</h1>
            <p className="text-xs text-gray-400 ml-4">Click anywhere on the map to set your location.</p>
            <input type="text" className="h-10 px-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 m-4" placeholder="How can I help you?"
                onChange={(e) => setPrompt(e.target.value)}
            />
            {!loading ? <button onClick={() => sendMessage()} className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg mx-4">Submit</button> : 
             <div className='p-4'>Loading...</div>
            }
            <div className={`${places.length > 0 ? "bg-gray-100" : "bg-white"} rounded-xl p-6 m-4`}>
                {places && !messages ? <div className=' h-60 overflow-auto'>
                    {places.length > 0 && <div className='font-bold pb-3 text-gray-700'>I found some useful locations. Gatherings more details. Just a moment...</div>}
                    {places.map((place, index) => (
                        <div key={index} >
                            {/* Render place details */}
                            <p>{place.name}</p>
                        </div>
                    ))}
                </div>
                    : <div className=' h-60 overflow-auto'><ReactMarkdown children={messages} /></div>}
            </div>
        </div>
        <div id="map" className='bg-white absolute top-0 left-0 right-0 bottom-0 w-1/2 h-full' />
    </div>)
};

export default MapComponent;
