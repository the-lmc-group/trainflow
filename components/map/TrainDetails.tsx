"use client";

import { X, ZoomIn, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterpolatedJourney } from "@/types/trains";
import { TrainStopsTimeline } from "./TimelineStops";
import { useEffect, useState, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Call {
  StopPointRef: string;
  StopPointName: string;
  AimedArrivalTime?: string;
  ExpectedArrivalTime?: string;
  AimedDepartureTime?: string;
  ExpectedDepartureTime?: string;
}

function getCalls(train: InterpolatedJourney): Call[] {
  const recorded = train.journey.RecordedCalls?.RecordedCall;
  const estimated = train.journey.EstimatedCalls?.EstimatedCall;

  const recordedArr = (
    Array.isArray(recorded) ? recorded : recorded ? [recorded] : []
  ) as Call[];
  const estimatedArr = (
    Array.isArray(estimated) ? estimated : estimated ? [estimated] : []
  ) as Call[];

  const allCalls = [...recordedArr, ...estimatedArr];

  return allCalls.sort((a, b) => {
    const timeA = new Date(
      a.ExpectedDepartureTime ||
        a.AimedDepartureTime ||
        a.ExpectedArrivalTime ||
        a.AimedArrivalTime ||
        ""
    ).getTime();
    const timeB = new Date(
      b.ExpectedDepartureTime ||
        b.AimedDepartureTime ||
        b.ExpectedArrivalTime ||
        b.AimedArrivalTime ||
        ""
    ).getTime();
    return timeA - timeB;
  });
}

export function TrainDetailsContent({ train }: { train: InterpolatedJourney }) {
  const [liveRatio, setLiveRatio] = useState(train.ratio);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const tA = new Date(train.tA).getTime();
      const tB = new Date(train.tB).getTime();
      const duration = tB - tA;

      let ratio = 0;
      if (duration > 0) {
        ratio = (now - tA) / duration;
      }
      ratio = Math.max(0, Math.min(1, ratio));
      setLiveRatio(ratio);

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [train]);

  const calls = getCalls(train);
  const currentStopIndex = calls.findIndex(
    (c) => c.StopPointRef === train.nextStopId
  );

  const stops = calls.map((call, index) => {
    let status: "passed" | "current" | "upcoming" = "upcoming";
    if (index < currentStopIndex) status = "passed";
    else if (index === currentStopIndex) status = "current";

    const formatTime = (aimed?: string, expected?: string) => {
      if (!aimed) return undefined;
      const aimedDate = new Date(aimed);
      const aimedStr = aimedDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (!expected) return aimedStr;
      const expectedDate = new Date(expected);
      const expectedStr = expectedDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (aimedStr === expectedStr) return aimedStr;

      return (
        <span className="flex flex-col leading-none">
          <span className="line-through text-red-500 opacity-70 text-[10px]">
            {aimedStr}
          </span>
          <span className="font-bold">{expectedStr}</span>
        </span>
      );
    };

    return {
      id: call.StopPointRef,
      name: call.StopPointName,
      arrivalTime: formatTime(call.AimedArrivalTime, call.ExpectedArrivalTime),
      departureTime: formatTime(
        call.AimedDepartureTime,
        call.ExpectedDepartureTime
      ),
      status,
    };
  });

  let progress = 0;
  if (calls.length > 1) {
    if (currentStopIndex > 0) {
      progress = (currentStopIndex - 1 + liveRatio) / (calls.length - 1);
    } else if (currentStopIndex === -1) {
      progress = 1;
    }
  }

  progress = Math.max(0, Math.min(1, progress));

  return (
    <div className="space-y-3 text-sm">
      <div>
        <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">
          Trajet
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="font-medium">Origine :</span>
            <span className="text-right">{train.journey.OriginName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Destination :</span>
            <span className="text-right">{train.journey.DestinationName}</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-2">
        <div className="text-xs text-muted-foreground uppercase font-semibold mb-2">
          Arrêts
        </div>

        <TrainStopsTimeline stops={stops} progress={progress} />
      </div>

      {train.delay && (
        <div className="border-t pt-2">
          <div className="text-red-500 font-bold">Retard: {train.delay}</div>
        </div>
      )}
    </div>
  );
}

export function TrainStatus({ train }: { train: InterpolatedJourney }) {
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();

      if (train.status === "upcoming") {
        const departIn = train.journey.departIn || 0;
        if (departIn < 60) {
          setStatus("Départ imminent");
        } else {
          setStatus(`Départ dans ${Math.ceil(departIn / 60)} min`);
        }
        return;
      }

      if (train.status === "completed") {
        setStatus("Terminus");
        return;
      }

      const tA = new Date(train.tA);
      const tB = new Date(train.tB);

      if (now < tA) {
        setStatus("A l'arrêt");
      } else {
        const diffMs = tB.getTime() - now.getTime();
        if (diffMs < 45000) {
          setStatus("Arrivée en gare");
        } else {
          setStatus(`Prochain arrêt ${Math.ceil(diffMs / 60000)} min`);
        }
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [train]);

  return <div className="text-xs text-muted-foreground mt-1">{status}</div>;
}

export function TrainActions({
  onZoom,
  onFollow,
  onFilter,
  isFollowing,
  isFiltered,
}: {
  onZoom: () => void;
  onFollow: () => void;
  onFilter: () => void;
  isFollowing: boolean;
  isFiltered: boolean;
}) {
  return (
    <div className="flex gap-1 mt-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onZoom}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoomer sur le train</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isFollowing ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={onFollow}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isFollowing ? "Ne plus suivre" : "Suivre le train"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isFiltered ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={onFilter}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isFiltered
                ? "Afficher tous les trains"
                : "Afficher uniquement ce train"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function TrainDetailsCard({
  train,
  onClose,
  onZoom,
  onFollow,
  onFilter,
  isFollowing,
  isFiltered,
}: {
  train: InterpolatedJourney;
  onClose: () => void;
  onZoom: () => void;
  onFollow: () => void;
  onFilter: () => void;
  isFollowing: boolean;
  isFiltered: boolean;
}) {
  return (
    <div className="bg-popover text-popover-foreground p-4 rounded-md border shadow-md w-60 flex flex-col gap-2 h-full overflow-y-auto">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg leading-tight">
            {train.journey.PublishedLineName || "Train"}
          </h3>
          <TrainStatus train={train} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mr-2 -mt-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <TrainActions
        onZoom={onZoom}
        onFollow={onFollow}
        onFilter={onFilter}
        isFollowing={isFollowing}
        isFiltered={isFiltered}
      />

      <div className="mt-2">
        <TrainDetailsContent train={train} />
      </div>
    </div>
  );
}
