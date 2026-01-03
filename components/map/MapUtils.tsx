"use client";

import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";

export function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click: () => {
      onMapClick();
    },
  });
  return null;
}

export function CreateMapPanes() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (!map.getPane("railsPane")) {
      const railsPane = map.createPane("railsPane");
      railsPane.style.zIndex = "650";
      railsPane.style.pointerEvents = "none";
    }

    if (!map.getPane("stationsPane")) {
      const stationsPane = map.createPane("stationsPane");
      stationsPane.style.zIndex = "700";
    }

    if (!map.getPane("trainsPane")) {
      const trainsPane = map.createPane("trainsPane");
      trainsPane.style.zIndex = "800";
    }

    if (!map.getPane("popupsPane")) {
      const popupsPane = map.createPane("popupsPane");
      popupsPane.style.zIndex = "900";
    }
  }, [map]);

  return null;
}
