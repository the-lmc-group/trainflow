"use client";

import { ReactNode } from "react";

type StopStatus = "passed" | "current" | "upcoming";
interface TimelineStop {
  id: string;
  name: string;
  arrivalTime?: ReactNode;
  departureTime?: ReactNode;
  status: StopStatus;
}

import { cn } from "@/lib/utils";

interface TrainStopsTimelineProps {
  stops: TimelineStop[];
  progress?: number;
}

export function TrainStopsTimeline({
  stops,
  progress: customProgress,
}: TrainStopsTimelineProps) {
  const currentIndex = stops.findIndex((s) => s.status === "current");
  const defaultProgress =
    currentIndex === -1 ? 0 : currentIndex / Math.max(1, stops.length - 1);

  const progress = customProgress ?? defaultProgress;
  const totalSteps = Math.max(1, stops.length - 1);
  const absoluteProgress = progress * totalSteps;

  return (
    <div className="relative">
      <ul className="flex flex-col gap-6">
        {stops.map((stop, index) => {
          const isActive = stop.status === "current";
          const isPassed = stop.status === "passed";
          const isLast = index === stops.length - 1;

          const isPastSegment = index < Math.floor(absoluteProgress);
          const isCurrentSegment = index === Math.floor(absoluteProgress);
          const segmentRatio = isPastSegment
            ? 1
            : isCurrentSegment
            ? absoluteProgress % 1
            : 0;

          return (
            <li key={stop.id} className="relative flex gap-4">
              {!isLast && (
                <div
                  className="absolute left-[3px] top-[10px] w-[6px] bg-muted rounded-full"
                  style={{ bottom: "calc(-1.5rem - 10px)" }}
                >
                  <div
                    className="absolute top-0 left-0 w-full bg-primary transition-all duration-300 rounded-full"
                    style={{ height: `${segmentRatio * 100}%` }}
                  />
                </div>
              )}

              <div
                className={cn(
                  "relative z-10 mt-1 h-3 w-3 rounded-full border",
                  isPassed && "bg-primary border-primary",
                  isActive &&
                    "bg-background border-primary ring-4 ring-primary/30",
                  stop.status === "upcoming" && "bg-background border-muted"
                )}
              />

              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {stop.arrivalTime && <span>{stop.arrivalTime}</span>}
                  {stop.departureTime && <span>→ {stop.departureTime}</span>}
                </div>

                <div
                  className={cn(
                    "text-sm font-medium",
                    isActive && "text-primary",
                    isPassed && "text-foreground",
                    stop.status === "upcoming" && "text-muted-foreground"
                  )}
                >
                  {stop.name}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
