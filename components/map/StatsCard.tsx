"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function StatsCard({
  activeCount,
  lastUpdate,
  nextRefresh,
  onRefresh,
  isRefreshing,
}: {
  activeCount: number;
  lastUpdate: Date | null;
  nextRefresh: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!nextRefresh) return;

    const updateTimeLeft = () => {
      const diff = Math.max(
        0,
        Math.ceil((nextRefresh.getTime() - Date.now()) / 1000)
      );
      setTimeLeft(diff);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [nextRefresh]);

  return (
    <div className="flex items-start gap-2">
      <div
        className={cn(
          "bg-popover text-popover-foreground p-4 rounded-md border shadow-md min-w-60 transition-all duration-300 ease-in-out origin-left",
          isOpen
            ? "opacity-100 scale-100 translate-x-0"
            : "opacity-0 scale-95 -translate-x-8 pointer-events-none absolute left-0"
        )}
      >
        <div className="flex justify-between items-center mb-3">
          <Link href="/" className="font-bold text-lg">
            Trainflow
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Trains Actifs</span>
            <span className="font-mono font-bold text-lg">{activeCount}</span>
          </div>
          <div className="pt-2 mt-2 border-t flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Dernière MàJ</span>
            <span className="text-xs font-mono">
              {lastUpdate ? lastUpdate.toLocaleTimeString() : "--:--:--"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Prochaine MàJ</span>
            <span className="text-xs font-mono">
              {isRefreshing || timeLeft === 0 ? (
                <LoaderCircle className="h-3 w-3 animate-spin inline-block" />
              ) : (
                `${timeLeft}s`
              )}
            </span>
          </div>
        </div>
      </div>

      <Button
        variant="secondary"
        size="icon"
        className="shadow-md border shrink-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
