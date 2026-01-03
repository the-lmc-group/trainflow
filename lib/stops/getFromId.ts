import StopsFile from "@/public/network/stops.json";
import GaresFile from "@/public/network/gares.json";
import { Gare } from "@/types/network";
import { extractUIC } from "@/lib/utils/extractIds";

export function getStopFromId(stopId: string) {
  return StopsFile.find((stop) => stop.id === stopId);
}

export function getGareFromId(stopId: string): Gare | undefined {
  const uic = extractUIC(stopId);
  if (!uic) return undefined;
  return (GaresFile as any[]).find((gare) => gare.uic === uic) as Gare;
}
