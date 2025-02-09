"use client";
import Map from "./components/map";
import Sidebar from "./components/sidebar";
import { useState } from "react";
import { User } from "lucide-react";

export default function Home() {
  const [coordinates, setCoordinates] = useState([-93.265, 44.978]);
  const [events, setEvents] = useState([
    {
      title: "Guthrie Theatre Community Tour",
      description:
        "Guthrie Theatre Community Tour dives into the history of Minneapolis’s iconic theatre’s history and famous past features.",
      coordinates: [-93.2650, 44.9778],
      isEvent: true,
    },
    {
      title: "Mill City Museum Tour",
      description:
        "History of the flour industry told through interactive exhibits in the rebuilt ruins of an old mill.",
      coordinates: [-93.2580, 44.9777], 
      isEvent: true,
    },
    {
      title: "Grandpa's Stories of Old Minneapolis",
      description:
        "A collection of personal memories and experiences shared from a lifetime in Minneapolis.",
      coordinates: [-93.2615, 44.9774], 
      isEvent: false,
    },
  ]);

  return (
    <div className="h-screen w-screen">
      <div className="absolute ml-0 mt-0 h-50 w-50 z-4 bg-50">
        <User />
      </div>
      <Map coordinates={coordinates} setCoordinates={setCoordinates} events={events}/>
      <Sidebar coordinates={coordinates} setCoordinates={setCoordinates} events={events} setEvent={setEvents}/>
    </div>
  );
}
