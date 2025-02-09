
"use client";

import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";

const Map = () => {
    const mapContainerRef = useRef();
    const mapRef = useRef();
    const [events, setEvents] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [clickedCoords, setClickedCoords] = useState({ lng: 0, lat: 0 });
    const [eventData, setEventData] = useState({ title: "", description: "" });

    // Fetch events from the backend
    useEffect(() => {
        axios.get("http://127.0.0.1:8000/api/events/")
            .then(response => setEvents(response.data))
            .catch(error => console.error("Error fetching events:", error));
    }, []);

    useEffect(() => {
        mapboxgl.accessToken = 'pk.eyJ1Ijoiam9zZWFwMTQiLCJhIjoiY202d25kNDJxMGNpdDJ3b253c3Y2cTFtciJ9.SLAy6bf556NyUWSksRkLjQ';

        mapRef.current = new mapboxgl.Map({
            style: 'mapbox://styles/mapbox/standard',
            center: [-93.265, 44.978],
            zoom: 15.5,
            container: 'map',
            antialias: true
        });

        // Load existing events on the map
        mapRef.current.on('load', () => {
            events.forEach(event => {
                new mapboxgl.Marker()
                    .setLngLat([event.longitude, event.latitude])
                    .setPopup(new mapboxgl.Popup().setText(event.title))
                    .addTo(mapRef.current);
            });
        });

        return () => mapRef.current.remove();
    }, [events]);

    // Handle double-click to show the form
    const handleMapDoubleClick = (event) => {
        const { lng, lat } = event.lngLat;
        setClickedCoords({ lng, lat });
        setShowForm(true);
    };

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.on("dblclick", handleMapDoubleClick);
        }
    }, []);

    // Handle form input
    const handleInputChange = (e) => {
        setEventData({ ...eventData, [e.target.name]: e.target.value });
    };

    // Handle form submission
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://127.0.0.1:8000/api/events/", {
                title: eventData.title,
                description: eventData.description,
                latitude: clickedCoords.lat,
                longitude: clickedCoords.lng
            });

            setEvents([...events, response.data.event]);
            setShowForm(false);
            setEventData({ title: "", description: "" });
        } catch (error) {
            console.error("Error adding event:", error);
        }
    };

    return (
        <div className="relative h-screen w-screen">
            <div id="map" ref={mapContainerRef} style={{ height: '100%' }}></div>

            {showForm && (
                <div className="absolute top-10 left-10 bg-white p-4 shadow-lg rounded-md text-black">
                    <h3 className="text-lg font-bold text-black">New Event</h3>
                    <p className="text-sm text-black">Location: {clickedCoords.lat}, {clickedCoords.lng}</p>
                    <form onSubmit={handleFormSubmit} className="flex flex-col space-y-2">
                        <input 
                            type="text" 
                            name="title" 
                            value={eventData.title} 
                            onChange={handleInputChange} 
                            placeholder="Event Title" 
                            className="border p-2 rounded-md text-black"
                            required
                        />
                        <textarea 
                            name="description" 
                            value={eventData.description} 
                            onChange={handleInputChange} 
                            placeholder="Event Description" 
                            className="border p-2 rounded-md text-black"
                            required
                        />
                        <button type="submit" className="bg-blue-500 text-white p-2 rounded-md">Save Event</button>
                        <button onClick={() => setShowForm(false)} className="text-red-500 p-2">Cancel</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Map;
