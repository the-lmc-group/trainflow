"use client";

import { useEffect, useState } from "react";
import { MapLayerGroup, MapMarker, MapPopup } from "@/components/ui/map";

interface Station {
  uic: string;
  lat: number;
  lon: number;
  name: string;
}

export function StationsLayer() {
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    fetch("/network/gares.json")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const seen = new Set();
        const uniqueStations = data.filter((s: Station) => {
          if (seen.has(s.uic)) return false;
          seen.add(s.uic);
          return true;
        });
        setStations(uniqueStations);
      })
      .catch((err) => console.error("Failed to load stations:", err));
  }, []);

  return (
    <MapLayerGroup name="Gares" pane="stationsPane">
      {stations.map((station) => (
        <MapMarker
          key={station.uic}
          position={[station.lat, station.lon]}
          icon={
            <div className="w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          }
          pane="stationsPane"
        >
          <MapPopup>
            <div className="text-sm">
              <strong>{station.name}</strong>
              <br />
              <span className="text-xs text-muted-foreground">
                UIC: {station.uic}
              </span>
            </div>
          </MapPopup>
        </MapMarker>
      ))}
    </MapLayerGroup>
  );
}
