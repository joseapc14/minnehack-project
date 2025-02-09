"use client";
import Map from "./components/map";
import Sidebar from "./components/sidebar";
import EventForm from "./components/eventForm";
import { useState, useEffect } from "react";
import { User, Search } from "lucide-react";

export default function Home() {
  const [latitude, setLatitude] = useState(44.978);
  const [longitude, setLongitude] = useState(-93.265);
  const [showForm, setShowForm] = useState(false);
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // **New state to hold the Mapbox instance**
  const [mapInstance, setMapInstance] = useState(null);

  // Fetch events when coordinates change
  useEffect(() => {
    const fetchEvents = async () => {
      const radius = 3;
      const url = `http://127.0.0.1:8000/get-events/?lat=${latitude}&lon=${longitude}&radius=${radius}`;
  
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && Array.isArray(data.events)) {
          setEvents(data.events);  
        } else {
          console.error("Unexpected data format:", data);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
  
    fetchEvents();
  }, [latitude, longitude]);

  const fetchRecommendedEvents = async () => {
    if (!searchTerm.trim()) return;

    try {
      const response = await fetch("http://localhost:8000/recommend-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ searchTerm }),
      });

      if (!response.ok) throw new Error("Failed to fetch recommended events");

      const data = await response.json();

      if (data && Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        console.error("Unexpected response format:", data);
      }
    } catch (error) {
      console.error("Error fetching recommended events:", error);
    }
  };

  return (
    <div className="h-screen w-screen">
      <div className="absolute ml-0 mt-0 h-50 w-50 z-4 bg-50">
        <User />
      </div>

      <div className="absolute top-4 left-12 z-10 flex items-center bg-white shadow-md rounded-lg px-3 py-2">
        <input
          type="text"
          className="outline-none bg-transparent w-60 text-black"
          placeholder="I'm searching for events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchRecommendedEvents()}
        />
        <button onClick={fetchRecommendedEvents} className="ml-2 p-1">
          <Search size={20} />
        </button>
      </div>

      {/* Pass setMapInstance to capture the Mapbox map instance */}
      <Map
        latitude={latitude}
        longitude={longitude}
        setLatitude={setLatitude}
        setLongitude={setLongitude}
        events={events}
        setMapInstance={setMapInstance}
      />
      
      {/* Pass the mapInstance so Sidebar can call flyTo() */}
      <Sidebar
        latitude={latitude}
        longitude={longitude}
        events={events}
        setEvents={setEvents}
        setShowForm={setShowForm}
        mapInstance={mapInstance}
      />

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <EventForm
              setShowForm={setShowForm}
              coordinates={[longitude, latitude]}
              setEvents={setEvents}
            />
          </div>
        </div>
      )}
    </div>
  );
}
