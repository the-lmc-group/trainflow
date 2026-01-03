"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingScreen({ isLoading }: { isLoading: boolean }) {
  const [isVisible, setIsVisible] = useState(true);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setIsVisible(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 50);
    return () => clearInterval(interval);
  }, [isLoading, startTime]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white transition-transform duration-1000 ease-in-out",
        !isLoading && "-translate-y-full"
      )}
    >
      <LoaderCircle className="h-12 w-12 animate-spin text-white" />
      <div className="mt-4 font-mono text-lg text-white">
        {(elapsed / 1000).toFixed(2)}s
      </div>
    </div>
  );
}
