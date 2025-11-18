import React, { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";

export default function GpxTrackLayer({ gpxUrl }) {
  const [coordinates, setCoordinates] = useState([]);

  useEffect(() => {
    if (!gpxUrl) {
      setCoordinates([]);
      return;
    }

    const parseGpx = async () => {
      try {
        const response = await fetch(gpxUrl);
        const gpxText = await response.text();
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(gpxText, "text/xml");
        
        const trkpts = xmlDoc.getElementsByTagName("trkpt");
        const coords = [];
        
        for (let i = 0; i < trkpts.length; i++) {
          const lat = parseFloat(trkpts[i].getAttribute("lat"));
          const lon = parseFloat(trkpts[i].getAttribute("lon"));
          coords.push([lat, lon]);
        }
        
        setCoordinates(coords);
      } catch (error) {
        console.error("Erreur lors du parsing du GPX:", error);
        setCoordinates([]);
      }
    };

    parseGpx();
  }, [gpxUrl]);

  if (coordinates.length === 0) return null;

  return (
    <Polyline
      positions={coordinates}
      color="#a855f7"
      weight={4}
      opacity={0.8}
    />
  );
}