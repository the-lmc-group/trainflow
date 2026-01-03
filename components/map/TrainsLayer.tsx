"use client";

import { useEffect, useRef, useMemo } from "react";
import { MapLayerGroup, MapMarker } from "@/components/ui/map";
import { cn } from "@/lib/utils";
import type { Marker } from "leaflet";
import { InterpolatedJourney } from "@/types/trains";
import { useMap } from "react-leaflet";

export function TrainsLayer({
  trains,
  selectedTrainId,
  onSelectTrain,
  followingTrainId,
}: {
  trains: InterpolatedJourney[];
  selectedTrainId: string | null;
  onSelectTrain: (id: string) => void;
  followingTrainId: string | null;
}) {
  const map = useMap();
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const requestRef = useRef<number>(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentTimestamp = useMemo(() => Date.now(), [trains]);

  useEffect(() => {
    const trainsMap = new Map(
      trains.map((t) => [
        t.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef,
        t,
      ])
    );

    const animate = () => {
      const now = Date.now();

      markersRef.current.forEach((marker, trainId) => {
        const train = trainsMap.get(trainId);
        if (!train || !train.lastStopCoords || !train.nextStopCoords) return;

        if (train.position && typeof train.bearing === "number") {
          return;
        }

        const tA = new Date(train.tA).getTime();
        const tB = new Date(train.tB).getTime();
        const duration = tB - tA;

        let ratio = 0;
        if (duration > 0) {
          ratio = (now - tA) / duration;
        }

        ratio = Math.max(0, Math.min(1, ratio));

        const lat =
          train.lastStopCoords.lat +
          (train.nextStopCoords.lat - train.lastStopCoords.lat) * ratio;
        const lon =
          train.lastStopCoords.lon +
          (train.nextStopCoords.lon - train.lastStopCoords.lon) * ratio;

        marker.setLatLng([lat, lon]);

        if (followingTrainId === trainId) {
          map.setView([lat, lon], map.getZoom(), { animate: false });
        }
      });

      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [trains]);

  return (
    <MapLayerGroup name="Trains">
      {trains.map((train) => {
        if (!train.lastStopCoords || !train.nextStopCoords) return null;

        const trainId =
          train.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef;
        let lat: number, lon: number, rotation: number;

        if (train.position && typeof train.bearing === "number") {
          lat = train.position.lat;
          lon = train.position.lon;
          rotation = 90 - train.bearing;
        } else {
          const tA = new Date(train.tA).getTime();
          const tB = new Date(train.tB).getTime();
          const duration = tB - tA;
          const now = currentTimestamp;

          let ratio = 0;
          if (duration > 0) {
            ratio = (now - tA) / duration;
          }

          ratio = Math.max(0, Math.min(1, ratio));

          lat =
            train.lastStopCoords.lat +
            (train.nextStopCoords.lat - train.lastStopCoords.lat) * ratio;
          lon =
            train.lastStopCoords.lon +
            (train.nextStopCoords.lon - train.lastStopCoords.lon) * ratio;

          const dy = train.nextStopCoords.lat - train.lastStopCoords.lat;
          const dx = train.nextStopCoords.lon - train.lastStopCoords.lon;
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          rotation = 90 - angle;
        }

        const isSelected = trainId === selectedTrainId;

        return (
          <MapMarker
            key={trainId}
            ref={(node) => {
              if (node) markersRef.current.set(trainId, node);
              else markersRef.current.delete(trainId);
            }}
            position={[lat, lon]}
            // rotationAngle={rotation}
            icon={
              <div
                className={cn(
                  "w-3 h-3 rounded-full border border-black/50 shadow-sm transition-colors",
                  isSelected ? "bg-red-500" : "bg-white"
                )}
              />
            }
            iconAnchor={[6, 6]}
            pane="trainsPane"
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation();
                onSelectTrain(trainId);
              },
            }}
          />
        );
      })}
    </MapLayerGroup>
  );
}
