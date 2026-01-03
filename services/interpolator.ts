import { Gare } from "@/types/network";
import type {
  SIRIData,
  SIRISNCFData,
  SIRIVehicleJourney,
  TrainJourney,
  TrainState,
} from "@/types/siri/providers";
import { getGareFromId } from "@/lib/stops/getFromId";
import { getSnappedPosition } from "./railManager";

type SIRICall = {
  StopPointRef?: string;
  ExpectedDepartureTime?: string;
  ExpectedArrivalTime?: string;
  AimedDepartureTime?: string;
  AimedArrivalTime?: string;
};

export function getTrainState(
  journey: SIRIVehicleJourney,
  now: Date
): TrainState {
  let recordedCalls = journey.RecordedCalls?.RecordedCall ?? [];
  if (!Array.isArray(recordedCalls)) recordedCalls = [recordedCalls];

  let estimatedCalls = journey.EstimatedCalls?.EstimatedCall ?? [];
  if (!Array.isArray(estimatedCalls)) estimatedCalls = [estimatedCalls];

  const calls = [
    ...(recordedCalls as SIRICall[]),
    ...(estimatedCalls as SIRICall[]),
  ];

  if (!calls || calls.length === 0) return "completed";

  const firstCall = calls[0];
  const lastCall = calls[calls.length - 1];

  if (!firstCall || !lastCall) return "completed";

  const start = toDate(
    firstCall.ExpectedDepartureTime ??
      firstCall.AimedDepartureTime ??
      firstCall.ExpectedArrivalTime ??
      firstCall.AimedArrivalTime
  );
  const end = toDate(
    lastCall.ExpectedArrivalTime ??
      lastCall.AimedArrivalTime ??
      lastCall.ExpectedDepartureTime ??
      lastCall.AimedDepartureTime
  );

  if (!start || !end) return "completed";
  if (now < start) return "upcoming";
  if (now > end) return "completed";
  return "active";
}

export function filterActiveTrains(
  journeys: SIRIData,
  now: Date
): SIRIVehicleJourney[] {
  return journeys
    .map((j) => {
      const t: TrainJourney = j;
      t.status = getTrainState(t, now);
      const rawCalls = (t.EstimatedCalls?.EstimatedCall ??
        t.RecordedCalls?.RecordedCall ??
        []) as SIRICall[] | undefined;
      const firstCall = rawCalls && rawCalls.length ? rawCalls[0] : undefined;
      const start = toDate(
        firstCall?.ExpectedDepartureTime ??
          firstCall?.AimedDepartureTime ??
          firstCall?.ExpectedArrivalTime ??
          firstCall?.AimedArrivalTime
      );
      t.departIn = start
        ? Math.max(0, Math.floor((start.getTime() - now.getTime()) / 1000))
        : null;
      return t;
    })
    .filter(
      (j) =>
        j.status === "active" ||
        (j.status === "upcoming" &&
          j.departIn != null) /* && j.departIn <= 60 * 10*/
    );
}

function toDate(s?: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function makeGareFromStopId(stopId?: string): Gare | null {
  if (!stopId) return null;
  const stop = getGareFromId(stopId);
  if (!stop) return null;
  return stop;
}

export function findActiveSegment(
  journey: SIRIVehicleJourney,
  now: Date
): { lastStop: Gare; nextStop: Gare } | null {
  const rawCalls = (journey.EstimatedCalls?.EstimatedCall ??
    journey.RecordedCalls?.RecordedCall ??
    []) as SIRICall[];
  if (!rawCalls || rawCalls.length === 0) return null;

  const calls = rawCalls
    .map((c) => {
      const time = toDate(
        c.ExpectedDepartureTime ??
          c.ExpectedArrivalTime ??
          c.AimedDepartureTime ??
          c.AimedArrivalTime
      );
      return { stopId: c.StopPointRef, time };
    })
    .filter(
      (c): c is { stopId: string; time: Date } =>
        c.stopId !== undefined && c.time !== null
    )
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  if (calls.length === 0) return null;

  const idx = calls.findIndex((c) => c.time.getTime() > now.getTime());

  let lastStopId: string | undefined;
  let nextStopId: string | undefined;

  if (idx === -1) {
    lastStopId = calls[calls.length - 1].stopId;
    nextStopId = undefined;
  } else if (idx === 0) {
    lastStopId = undefined;
    nextStopId = calls[0].stopId;
  } else {
    lastStopId = calls[idx - 1].stopId;
    nextStopId = calls[idx].stopId;
  }

  if (!lastStopId || !nextStopId) return null;

  const lastGare = makeGareFromStopId(lastStopId);
  const nextGare = makeGareFromStopId(nextStopId);

  if (!lastGare || !nextGare) return null;

  return { lastStop: lastGare, nextStop: nextGare };
}

import { InterpolatedJourney } from "@/types/trains";

function calculateDelay(journey: SIRIVehicleJourney): string | undefined {
  const recordedCalls = journey.RecordedCalls?.RecordedCall;
  const estimatedCalls = journey.EstimatedCalls?.EstimatedCall;

  const calls = [
    ...(Array.isArray(recordedCalls)
      ? recordedCalls
      : recordedCalls
      ? [recordedCalls]
      : []),
    ...(Array.isArray(estimatedCalls)
      ? estimatedCalls
      : estimatedCalls
      ? [estimatedCalls]
      : []),
  ] as SIRICall[];

  if (calls.length === 0) return undefined;

  let maxDelay = 0;

  for (const call of calls) {
    if (call.AimedArrivalTime && call.ExpectedArrivalTime) {
      const diff =
        new Date(call.ExpectedArrivalTime).getTime() -
        new Date(call.AimedArrivalTime).getTime();
      if (diff > maxDelay) maxDelay = diff;
    }
    if (call.AimedDepartureTime && call.ExpectedDepartureTime) {
      const diff =
        new Date(call.ExpectedDepartureTime).getTime() -
        new Date(call.AimedDepartureTime).getTime();
      if (diff > maxDelay) maxDelay = diff;
    }
  }

  if (maxDelay >= 60000) {
    const totalMinutes = Math.floor(maxDelay / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
    }
    return `${minutes}min`;
  }

  return undefined;
}

export function interpolate(data: SIRIData, now: Date): InterpolatedJourney[] {
  const activeJourneys = filterActiveTrains(data, now);

  const results: InterpolatedJourney[] = [];

  function getLatLon(g: Gare): { lat: number; lon: number } | null {
    if ("lat" in g) {
      return { lat: g.lat, lon: g.lon };
    }
    if ("geometry" in g && g.geometry.coordinates) {
      return { lat: g.geometry.coordinates[1], lon: g.geometry.coordinates[0] };
    }
    if ("properties" in g && g.properties.geo_point_2d) {
      return {
        lat: g.properties.geo_point_2d.lat,
        lon: g.properties.geo_point_2d.lon,
      };
    }
    return null;
  }

  for (const journey of activeJourneys) {
    const sourceCalls =
      journey.EstimatedCalls?.EstimatedCall ??
      journey.RecordedCalls?.RecordedCall ??
      [];

    const rawCalls = (
      Array.isArray(sourceCalls) ? sourceCalls : [sourceCalls]
    ) as SIRICall[];

    if (!rawCalls || rawCalls.length < 2) continue;

    const calls = rawCalls
      .map((c) => {
        const time = toDate(
          c.ExpectedDepartureTime ??
            c.ExpectedArrivalTime ??
            c.AimedDepartureTime ??
            c.AimedArrivalTime
        );
        return { stopId: c.StopPointRef, time };
      })
      .filter(
        (c): c is { stopId: string; time: Date } =>
          c.stopId !== undefined && c.time !== null
      )
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    for (let i = 0; i < calls.length - 1; i++) {
      const A = calls[i];
      const B = calls[i + 1];
      const tA = A.time;
      const tB = B.time;

      if (tA.getTime() <= now.getTime() && now.getTime() < tB.getTime()) {
        const denom = tB.getTime() - tA.getTime();
        const ratio = denom > 0 ? (now.getTime() - tA.getTime()) / denom : 0;

        const lastStop = makeGareFromStopId(A.stopId);
        const nextStop = makeGareFromStopId(B.stopId);

        let position: { lat: number; lon: number } | undefined;
        let bearing: number | undefined;

        if (lastStop && nextStop) {
          const lastCoords = getLatLon(lastStop);
          const nextCoords = getLatLon(nextStop);

          if (lastCoords && nextCoords) {
            const lat =
              lastCoords.lat + (nextCoords.lat - lastCoords.lat) * ratio;
            const lon =
              lastCoords.lon + (nextCoords.lon - lastCoords.lon) * ratio;

            const snapped = getSnappedPosition(lat, lon);
            if (snapped) {
              position = { lat: snapped.lat, lon: snapped.lon };
              bearing = snapped.bearing;
            } else {
              position = { lat, lon };
              const dy = nextCoords.lat - lastCoords.lat;
              const dx = nextCoords.lon - lastCoords.lon;
              bearing = (Math.atan2(dy, dx) * 180) / Math.PI;
            }

            results.push({
              journey,
              status: "active",
              lastStopId: A.stopId,
              nextStopId: B.stopId,
              lastStop: lastStop ?? undefined,
              nextStop: nextStop ?? undefined,
              lastStopCoords: lastCoords,
              nextStopCoords: nextCoords,
              tA,
              tB,
              ratio,
              position,
              bearing,
              delay: calculateDelay(journey),
            });
          }
        }

        break;
      }
    }
  }
  return results;
}

export function processSiriData(rawData: SIRISNCFData): SIRIVehicleJourney[] {
  const frames =
    rawData.Siri.ServiceDelivery.EstimatedTimetableDelivery
      .EstimatedJourneyVersionFrame;

  const data: SIRIVehicleJourney[] = (() => {
    if (!frames) return [];
    const frameArray = Array.isArray(frames) ? frames : [frames];
    return frameArray.flatMap((f) => f.EstimatedVehicleJourney ?? []);
  })();

  console.log(`Total journeys fetched: ${data.length}`);
  return filterActiveTrains(data, new Date());
}
