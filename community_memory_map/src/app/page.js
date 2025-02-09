"use client";
import Map from "./components/map";
import Sidebar from "./components/sidebar";
import EventForm from "./components/eventForm";
import { useState, useEffect } from "react";
import { User } from "lucide-react";

export default function Home() {
  const [latitude, setLatitude] = useState(44.978);
  const [longitude, setLongitude] = useState(-93.265);
  const [showForm, setShowForm] = useState(false);
  const [events, setEvents] = useState([]);

  // Fetch events when coordinates change
  useEffect(() => {
    const fetchEvents = async () => {
      const radius = 3;
      const url = `http://127.0.0.1:8000/get-events/?lat=${latitude}&lon=${longitude}&radius=${radius}`;
  
      try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data)
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

  return (
    <div className="h-screen w-screen">
      <div className="absolute ml-0 mt-0 h-50 w-50 z-4 bg-50">
        <User />
      </div>
      <Map latitude={latitude} longitude={longitude} setLatitude={setLatitude} setLongitude={setLongitude} events={events}/>
      <Sidebar latitude={latitude} longitude={longitude} events={events} setEvent={setEvents} setShowForm={setShowForm}/>

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
