"use client";

import {
  Map as MapComponent,
  MapTileLayer,
  MapZoomControl,
  MapLayersControl,
  MapLayers,
  MapLayerGroup,
} from "@/components/ui/map";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { StatsCard } from "@/components/map/StatsCard";
import {
  TrainDetailsCard,
  TrainDetailsContent,
} from "@/components/map/TrainDetails";
import { TrainsLayer } from "@/components/map/TrainsLayer";
import { StationsLayer } from "@/components/map/StationsLayer";
import { RailsVectorTiles } from "@/components/map/RailsVectorTiles";
import { MapClickHandler, CreateMapPanes } from "@/components/map/MapUtils";

import { InterpolatedJourney } from "@/types/trains";
import type { Map as LeafletMap } from "leaflet";

const MAX_ZOOM = 18;

export default function MapView() {
  const [trains, setTrains] = useState<InterpolatedJourney[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null);
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
  const [followingTrainId, setFollowingTrainId] = useState<string | null>(null);
  const [filterTrainId, setFilterTrainId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const trainsRef = useRef<InterpolatedJourney[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    trainsRef.current = trains;
  }, [trains]);

  const selectedTrain = useMemo(
    () =>
      trains.find(
        (t) =>
          t.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef ===
          selectedTrainId
      ),
    [trains, selectedTrainId]
  );

  const fetchTrains = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsRefreshing(true);
    try {
      const res = await fetch("/api/trains/live");
      const data = await res.json();
      if (Array.isArray(data)) {
        if (data.length === 0 && trainsRef.current.length > 0) {
          console.warn(
            "Received empty trains data while having active trains. Ignoring update."
          );
        } else {
          setTrains(data);
          setLastUpdate(new Date());
        }
      }
    } catch (err) {
      console.error("Failed to fetch trains:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      const delay = 30000;
      setNextRefresh(new Date(Date.now() + delay));
      timeoutRef.current = setTimeout(fetchTrains, delay);
    }
  }, []);

  useEffect(() => {
    fetchTrains();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fetchTrains]);

  const activeCount = trains.filter((t) => t.status === "active").length;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleZoomToTrain = () => {
    if (selectedTrain && mapRef.current && selectedTrain.position) {
      mapRef.current.flyTo(
        [selectedTrain.position.lat, selectedTrain.position.lon],
        14
      );
    }
  };

  const handleFollowTrain = () => {
    if (followingTrainId === selectedTrainId) {
      setFollowingTrainId(null);
    } else {
      setFollowingTrainId(selectedTrainId);
    }
  };

  const handleFilterTrain = () => {
    if (filterTrainId === selectedTrainId) {
      setFilterTrainId(null);
    } else {
      setFilterTrainId(selectedTrainId);
    }
  };

  const displayedTrains = useMemo(() => {
    if (filterTrainId) {
      return trains.filter(
        (t) =>
          t.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef ===
          filterTrainId
      );
    }
    return trains;
  }, [trains, filterTrainId]);

  return (
    <div style={{ position: "fixed", inset: 0 }} className="bg-zinc-900">
      <LoadingScreen isLoading={isLoading} />
      <MapComponent
        center={[46.5, 2.5]}
        zoom={5}
        maxZoom={MAX_ZOOM}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <MapClickHandler onMapClick={() => setSelectedTrainId(null)} />
        <MapLayers defaultLayerGroups={["Rails", "Trains"]}>
          <MapLayersControl />
          <CreateMapPanes />
          <MapTileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            darkUrl="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          />
          <MapLayerGroup name="Rails">
            <RailsVectorTiles url="http://fr1.orionhost.xyz:5010/data/rails/{z}/{x}/{y}.pbf" />
          </MapLayerGroup>
          <StationsLayer />
          <TrainsLayer
            trains={displayedTrains}
            selectedTrainId={selectedTrainId}
            onSelectTrain={setSelectedTrainId}
            followingTrainId={followingTrainId}
          />
        </MapLayers>
        <MapZoomControl />
      </MapComponent>

      <div className="absolute top-2 left-2 bottom-2 z-1000 flex flex-col gap-2 pointer-events-none w-fit">
        <div className="pointer-events-auto">
          <StatsCard
            activeCount={activeCount}
            lastUpdate={lastUpdate}
            nextRefresh={nextRefresh}
            onRefresh={fetchTrains}
            isRefreshing={isRefreshing}
          />
        </div>
        {selectedTrain && isDesktop && (
          <div className="pointer-events-auto flex-1 min-h-0 flex flex-col">
            <TrainDetailsCard
              train={selectedTrain}
              onClose={() => setSelectedTrainId(null)}
              onZoom={handleZoomToTrain}
              onFollow={handleFollowTrain}
              onFilter={handleFilterTrain}
              isFollowing={followingTrainId === selectedTrainId}
              isFiltered={filterTrainId === selectedTrainId}
            />
          </div>
        )}
      </div>

      {!isDesktop && (
        <Drawer
          open={!!selectedTrain}
          onOpenChange={(open) => {
            if (!open) setSelectedTrainId(null);
          }}
        >
          <DrawerContent>
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader className="relative">
                <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DrawerClose>
                <DrawerTitle>
                  {selectedTrain?.journey.PublishedLineName || "Train"}
                </DrawerTitle>
                <DrawerDescription>
                  N°{" "}
                  {
                    selectedTrain?.journey.FramedVehicleJourneyRef
                      .DatedVehicleJourneyRef
                  }
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pb-0">
                {selectedTrain && <TrainDetailsContent train={selectedTrain} />}
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
