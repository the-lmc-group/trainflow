import { Gare } from "@/types/network";
import { SIRIVehicleJourney, TrainState } from "@/types/siri/providers";

export interface InterpolatedJourney {
  journey: SIRIVehicleJourney;
  status: TrainState;
  lastStopId: string;
  nextStopId: string;
  lastStop?: Gare;
  nextStop?: Gare;
  lastStopCoords?: { lat: number; lon: number };
  nextStopCoords?: { lat: number; lon: number };
  tA: Date;
  tB: Date;
  ratio: number;
  position?: { lat: number; lon: number };
  bearing?: number;
  delay?: string;
}
