"use client";

import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const Map = (props) => {
  const { latitude, longitude, setLatitude, setLongitude, events } = props;

  const mapContainerRef = useRef();
  const mapRef = useRef();

  const [lightPreset, setLightPreset] = useState("day");

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1Ijoiam9zZWFwMTQiLCJhIjoiY202d25kNDJxMGNpdDJ3b253c3Y2cTFtciJ9.SLAy6bf556NyUWSksRkLjQ";

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [longitude, latitude],
      zoom: 15.5,
      pitch: 60,
      bearing: -17.6,
      antialias: true,
      projection: "globe",
      hash: true,
      config: {
        basemap: {
          lightPreset: "dusk",
        },
      },
    });

    mapRef.current.on("style.load", () => {
      const zoomBasedReveal = (value) => {
        return ["interpolate", ["linear"], ["zoom"], 11, 0.0, 13, value];
      };
      mapRef.current.setSnow({
        density: zoomBasedReveal(0.85),
        intensity: 1.0,
        "center-thinning": 0.1,
        direction: [0, 50],
        opacity: 1.0,
        color: `#ffffff`,
        "flake-size": 0.2,
        vignette: zoomBasedReveal(0.2),
        "vignette-color": `#ffffff`,
      });
    });

    mapRef.current.on("click", (e) => {
      setLatitude(e.lngLat.lat);
      setLongitude(e.lngLat.lng);
    });

    var marker = new mapboxgl.Marker();
    function add_marker(event) {
      var coordinates = event.lngLat;
      marker.setLngLat(coordinates).addTo(mapRef.current);
    }
    mapRef.current.on("click", add_marker);

    return () => mapRef.current.remove();
  }, []);
  
  useEffect(() => {
    if (!mapRef.current) return;
  
    const updateMapWithEvents = () => {
      events.forEach((event) => {
        const iconUrl = event.imageurl;  // Assuming each event has a unique imageurl property
  
        mapRef.current.loadImage(iconUrl, (error, image) => {
          if (error) {
            console.error("Error loading image:", error);
            return;
          }
  
          // Add the image for the event if it doesn't exist
          if (!mapRef.current.hasImage(event.title)) {
            mapRef.current.addImage(event.title, image);
          }
  
          // Add source if it doesn't already exist
          if (!mapRef.current.getSource(event.title)) {
            mapRef.current.addSource(event.title, {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    geometry: {
                      type: "Point",
                      coordinates: [event.longitude, event.latitude],
                    },
                    properties: {
                      title: event.title,
                      description: event.description,
                    },
                  },
                ],
              },
            });
          }
  
          // Add layer if it doesn't already exist
          if (!mapRef.current.getLayer(event.title)) {
            mapRef.current.addLayer({
              id: event.title,
              type: "symbol",
              source: event.title,
              layout: {
                "icon-image": event.title,
                "icon-size": 0.2,  
                // "text-field": ["get", "title"],
                // "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                // "text-offset": [0, 1.5],  // Position title below the icon
                // "text-anchor": "bottom-left",  // Position text in the bottom-left corner
                // "text-size": 12,
              },
              // paint: {
              //   "text-color": "white",  
              // },
            });
          }
  
          mapRef.current.on("click", event.title, (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const title = e.features[0].properties.title;
            const description = e.features[0].properties.description;
  
            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(`<strong>${title}</strong><p>${description}</p>`)
              .addTo(mapRef.current);
          });
  
          mapRef.current.on("mouseenter", event.title, () => {
            mapRef.current.getCanvas().style.cursor = "pointer";
          });
  
          mapRef.current.on("mouseleave", event.title, () => {
            mapRef.current.getCanvas().style.cursor = "";
          });
        });
      });
    };
  
    updateMapWithEvents();
  
    // Cleanup logic: Remove layers and sources that no longer exist in the new events
    return () => {
      const currentEventTitles = events.map((event) => event.title);
      const allLayers = mapRef.current.getStyle().layers || [];
      allLayers.forEach((layer) => {
        if (!currentEventTitles.includes(layer.id)) {
          if (mapRef.current.getLayer(layer.id)) {
            mapRef.current.removeLayer(layer.id);
          }
          if (mapRef.current.getSource(layer.id)) {
            mapRef.current.removeSource(layer.id);
          }
        }
      });
    };
  }, [events]);
  

  return <div ref={mapContainerRef} style={{ height: "100%" }}></div>;
};

export default Map;
