"use client"
import Map from "./components/map";
import Sidebar from "./components/sidebar";
import { useState } from 'react';

export default function Home() {
  const [coordinates, setCoordinates] = useState([-93.265, 44.978]);
  
  return (
    <div className="h-screen w-screen">
      <Map coordinates={coordinates}/>
      <Sidebar coordinates={coordinates} setCoordinates={setCoordinates}/>
    </div>
  );
}
