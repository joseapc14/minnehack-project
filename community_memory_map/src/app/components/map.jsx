"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const Map = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1Ijoiam9zZWFwMTQiLCJhIjoiY202d25kNDJxMGNpdDJ3b253c3Y2cTFtciJ9.SLAy6bf556NyUWSksRkLjQ";

    // Initialize the map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12", // 3D-ready style
      center: [-93.265, 44.978], // Default center (Minneapolis)
      zoom: 12,
      pitch: 60, // Tilt to enable 3D
      bearing: -15, // Rotate slightly for better perspective
      antialias: true,
    });

    mapRef.current.on("load", () => {
      // Add a Digital Elevation Model (DEM) source for terrain
      mapRef.current.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.terrain-rgb",
        tileSize: 512,
        maxzoom: 14,
      });

      // Enable terrain with exaggeration
      mapRef.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

      // Add 3D buildings
      mapRef.current.addLayer({
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": "#aaa",
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": ["get", "min_height"],
          "fill-extrusion-opacity": 0.6,
        },
      });

      // Add a sky layer for realism
      mapRef.current.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 90.0],
          "sky-atmosphere-sun-intensity": 15,
        },
      });
    });

    return () => mapRef.current.remove();
  }, []);

  return <div ref={mapContainerRef} style={{ height: "100vh", width: "100%" }} />;
};

export default Map;
