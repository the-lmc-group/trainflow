export function extractRouteIdFromTripId(tripId: string): string | null {
  // Pour SNCF : FR:Line::XXXX
  // Pour IDFM : IDFM:CXXXXX
  const match = tripId.match(/(FR:Line::[^:]+:|IDFM:\d+)/);
  return match ? match[0] : null;
}

export function extractUIC(stopId: string): string | undefined {
  const sncfMatch = stopId.match(/TER-(\d{7,8})$/);
  if (sncfMatch) return sncfMatch[1];

  const scheduledMatch = stopId.match(/FR:ScheduledStopPoint::(\d+)/);
  if (scheduledMatch) return scheduledMatch[1];

  const idfmMatch = stopId.match(/IDFM:monomodalStopPlace:(\d+)/);
  if (idfmMatch) return idfmMatch[1];

  return undefined;
}
