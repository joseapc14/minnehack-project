"use client";

import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const Map = (props) => {
  const { coordinates, setCoordinates, events } = props;

  const mapContainerRef = useRef();
  const [clickEvent, setClickEvent] = useState();
  const mapRef = useRef();

  const [lightPreset, setLightPreset] = useState("day");

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1Ijoiam9zZWFwMTQiLCJhIjoiY202d25kNDJxMGNpdDJ3b253c3Y2cTFtciJ9.SLAy6bf556NyUWSksRkLjQ";

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [coordinates[0], coordinates[1]],
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
      setClickEvent(e);
      setCoordinates([e.lngLat.lng, e.lngLat.lat]);
    });

    var marker = new mapboxgl.Marker();
    function add_marker(event) {
      var coordinates = event.lngLat;
      console.log("Lng:", coordinates.lng, "Lat:", coordinates.lat);
      marker.setLngLat(coordinates).addTo(mapRef.current);
    }
    mapRef.current.on("click", add_marker);

    return () => mapRef.current.remove();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.once("style.load", () => {
      // Load the marker icon once
      const iconUrl = "https://docs.mapbox.com/mapbox-gl-js/assets/cat.png";
      mapRef.current.loadImage(iconUrl, (error, image) => {
        if (error) {
          console.error("Error loading image:", error);
          return;
        }

        if (!mapRef.current.hasImage("event-icon")) {
          mapRef.current.addImage("event-icon", image);
        }

        events.forEach((event) => {
          mapRef.current.addSource(event.title, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: event.coordinates,
                  },
                  properties: {
                    title: event.title,
                    description: event.description,
                  },
                },
              ],
            },
          });

          mapRef.current.addLayer({
            id: event.title,
            type: "symbol",
            source: event.title,
            layout: {
              "icon-image": "event-icon",
              "icon-size": 0.25,
              "text-field": ["get", "title"],
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-offset": [0, 1.5],
              "text-anchor": "top",
              "text-size": 12,
            },
          });

          // Click event for event markers
          mapRef.current.on("click", event.title, (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const title = e.features[0].properties.title;
            const description = e.features[0].properties.description;

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(`<strong>${title}</strong><p>${description}</p>`)
              .addTo(mapRef.current);
          });

          // Hover effects
          mapRef.current.on("mouseenter", event.title, () => {
            mapRef.current.getCanvas().style.cursor = "pointer";
          });

          mapRef.current.on("mouseleave", event.title, () => {
            mapRef.current.getCanvas().style.cursor = "";
          });
        });
      });
    });

    return () => {
      events.forEach((event) => {
        if (mapRef.current.getLayer(event.title)) {
          mapRef.current.removeLayer(event.title);
        }
        if (mapRef.current.getSource(event.title)) {
          mapRef.current.removeSource(event.title);
        }
      });
    };
  }, [events]);

  return <div ref={mapContainerRef} style={{ height: "100%" }}></div>;
};

export default Map;
