"use client";
import Map from "./components/map";
import Sidebar from "./components/sidebar";
import { useState } from "react";
import { User } from "lucide-react";

export default function Home() {
  const [coordinates, setCoordinates] = useState([-93.265, 44.978]);

  return (
    <div className="h-screen w-screen">
      <div className="absolute ml-0 mt-0 h-50 w-50 z-4 bg-50">
        <User />
      </div>
      <Map coordinates={coordinates} setCoordinates={setCoordinates} />
      <Sidebar coordinates={coordinates} setCoordinates={setCoordinates} />
    </div>
  );
}
