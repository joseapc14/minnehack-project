"use client";

import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const Map = (props) => {
  const { coordinates, setCoordinates } = props;

  const mapContainerRef = useRef();
  const [clickEvent, setClickEvent] = useState();
  const mapRef = useRef();

  const [lightPreset, setLightPreset] = useState("day");
  const [events, setEvents] = useState([]);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1Ijoiam9zZWFwMTQiLCJhIjoiY202d25kNDJxMGNpdDJ3b253c3Y2cTFtciJ9.SLAy6bf556NyUWSksRkLjQ";

    mapRef.current = new mapboxgl.Map({
      style: "mapbox://styles/mapbox/standard",
      center: [coordinates[0], coordinates[1]],
      zoom: 15.5,
      pitch: 60,
      bearing: -17.6,
      container: "map",
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
      // const layers = mapRef.current.getStyle().layers;
      // const labelLayerId = layers.find(
      //   (layer) => layer.type === 'symbol' && layer.layout['text-field']
      // ).id;

      // mapRef.current.addLayer(
      //   {
      //     id: 'add-3d-buildings',
      //     source: 'composite',
      //     'source-layer': 'building',
      //     filter: ['==', 'extrude', 'true'],
      //     type: 'fill-extrusion',
      //     minzoom: 15,
      //     paint: {
      //       'fill-extrusion-color': '#aaa',
      //       'fill-extrusion-height': [
      //         'interpolate',
      //         ['linear'],
      //         ['zoom'],
      //         15,
      //         0,
      //         15.05,
      //         ['get', 'height']
      //       ],
      //       'fill-extrusion-base': [
      //         'interpolate',
      //         ['linear'],
      //         ['zoom'],
      //         15,
      //         0,
      //         15.05,
      //         ['get', 'min_height']
      //       ],
      //       'fill-extrusion-opacity': 0.6
      //     }
      //   },
      //   labelLayerId
      // );

      // const map = mapRef.current;
      // const zoomBasedReveal = (value) => {
      //     return ['interpolate', ['linear'], ['zoom'], 11, 0.0, 13, value];
      // };

      // map.setSnow({
      //     density: zoomBasedReveal(0.85),
      //     intensity: 1.0,
      //     'center-thinning': 0.1,
      //     direction: [0, 50],
      //     opacity: 1.0,
      //     color: `#ffffff`,
      //     'flake-size': 0.71,
      //     vignette: zoomBasedReveal(0.3),
      //     'vignette-color': `#ffffff`
      //   });

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
    });

    return () => mapRef.current.remove();
  }, []);

  return <div id="map" ref={mapContainerRef} style={{ height: "100%" }}></div>;
};

export default Map;
