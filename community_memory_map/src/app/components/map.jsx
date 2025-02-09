// map.jsx
"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const Map = (props) => {
  const { latitude, longitude, setLatitude, setLongitude, events, setMapInstance } = props;
  const mapContainerRef = useRef();
  const mapRef = useRef();

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

    // When the map loads, pass the instance upward
    mapRef.current.on("load", () => {
      if (setMapInstance) {
        setMapInstance(mapRef.current);
      }
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

  // Existing useEffect to update markers based on events…
  useEffect(() => {
    if (!mapRef.current) return;
  
    const updateMapWithEvents = () => {
      events.forEach((event) => {
        const iconUrl = event.imageurl; // Assuming each event has a unique imageurl
  
        mapRef.current.loadImage(iconUrl, (error, image) => {
          if (error) {
            console.error("Error loading image:", error);
            return;
          }
  
          if (!mapRef.current.hasImage(event.title)) {
            mapRef.current.addImage(event.title, image);
          }
  
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
  
          if (!mapRef.current.getLayer(event.title)) {
            mapRef.current.addLayer({
              id: event.title,
              type: "symbol",
              source: event.title,
              layout: {
                "icon-image": event.title,
                "icon-size": 0.2,
              },
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
