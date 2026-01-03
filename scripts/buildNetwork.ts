import { parseCSV } from "@/lib/utils/csv";
import { extractRouteIdFromTripId, extractUIC } from "@/lib/utils/extractIds";
import TransportNetwork, { Line, Stop } from "@/types/network";
import * as fs from "fs";
import * as path from "path";

const GTFSIDFMStopTime = fs.readFileSync(
  path.resolve(__dirname, "../data/gtfs-idfm/stop_times.txt"),
  "utf8"
);
const IDFMRoutes = fs.readFileSync(
  path.resolve(__dirname, "../data/gtfs-idfm/routes.txt"),
  "utf8"
);
const IDFMTrips = fs.readFileSync(
  path.resolve(__dirname, "../data/gtfs-idfm/trips.txt"),
  "utf8"
);

const GTFSSNCFStopTime = fs.readFileSync(
  path.resolve(__dirname, "../data/gtfs-sncf/stop_times.txt"),
  "utf8"
);
const SNCFRoutes = fs.readFileSync(
  path.resolve(__dirname, "../data/gtfs-sncf/routes.txt"),
  "utf8"
);
const SNCFTrips = fs.readFileSync(
  path.resolve(__dirname, "../data/gtfs-sncf/trips.txt"),
  "utf8"
);

const stopsFile = fs.readFileSync(
  path.resolve(__dirname, "../public/network/stops.json"),
  "utf8"
);
const stops = JSON.parse(stopsFile);
const outputPath = path.resolve(__dirname, "../data/network/trainNetwork.json");
const providers = ["IDFM", "SNCF"];

const version = "1.0.0";
const generatedAt = new Date().toISOString();

function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs}h ${mins}m ${secs}s`;
}

function progress(label: string, current: number, total: number) {
  const width = 15;
  const ratio = total === 0 ? 1 : current / total;
  const filled = Math.round(ratio * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);

  if (!progress.startTimes) progress.startTimes = {} as Record<string, number>;
  if (!progress.startTimes[label]) progress.startTimes[label] = Date.now();
  const elapsed = (Date.now() - progress.startTimes[label]) / 1000;
  const speed = current > 0 ? elapsed / current : 0;
  const remaining = speed > 0 ? (total - current) * speed : 0;
  const eta =
    remaining > 0
      ? ` (${current}/${total}) | ETA: ${formatTime(remaining)} | ${new Date(
          Date.now() + remaining * 1000
        ).toLocaleTimeString()}`
      : "";

  process.stdout.write(`\r${label} [${bar}] ${Math.round(ratio * 100)}%${eta}`);
  if (current === total) {
    process.stdout.write("\n");
    delete progress.startTimes[label];
  }
}
progress.startTimes = {} as Record<string, number>;

export default function buildTrainNetwork(): TransportNetwork {
  const parsedIDFM = parseCSV(GTFSIDFMStopTime);
  const parsedSNCF = parseCSV(GTFSSNCFStopTime);
  const parsedIDFMRoutes = parseCSV(IDFMRoutes);
  const parsedSNCFRoutes = parseCSV(SNCFRoutes);
  const parsedIDFMTrips = parseCSV(IDFMTrips);
  const parsedSNCFTrips = parseCSV(SNCFTrips);
  console.log(
    `Fichiers csv parsés ${
      parsedIDFM.length + parsedSNCF.length
    } lignes (IDFM: ${parsedIDFM.length}, SNCF: ${parsedSNCF.length})`
  );
  const linesByProvider: Record<string, Set<string>> = {
    IDFM: new Set<string>(),
    SNCF: new Set<string>(),
  };

  for (const provider of providers) {
    const parsed = provider === "IDFM" ? parsedIDFM : parsedSNCF;
    const parsedTrips = provider === "IDFM" ? parsedIDFMTrips : parsedSNCFTrips;

    const tripToRoute = new Map<string, string>();
    for (const t of parsedTrips) {
      const tid = t["trip_id"];
      if (!tid) continue;
      const rid =
        provider === "IDFM"
          ? t["route_id"]
          : t["route_id"] || extractRouteIdFromTripId(tid);
      if (rid) tripToRoute.set(tid, rid);
    }

    const uniqueTripIds = Array.from(
      new Set(parsed.map((r) => r["trip_id"]).filter(Boolean))
    ) as string[];
    for (let i = 0; i < uniqueTripIds.length; i++) {
      const tripId = uniqueTripIds[i];
      progress(
        `Extraction des lignes ${provider}`,
        i + 1,
        uniqueTripIds.length
      );
      const rawLineId = tripToRoute.get(tripId);
      const normalizedLineId = rawLineId;
      if (normalizedLineId) {
        linesByProvider[provider].add(normalizedLineId);
      }
    }
  }

  const lines: Line[] = [];
  for (const provider of providers) {
    const providerLines = Array.from(linesByProvider[provider]);
    for (let idx = 0; idx < providerLines.length; idx++) {
      const lineId = providerLines[idx];
      progress(
        `Construction des lignes ${provider}`,
        idx + 1,
        providerLines.length
      );
      const parsedRoute =
        provider === "IDFM" ? parsedIDFMRoutes : parsedSNCFRoutes;
      const name =
        parsedRoute.find((e) => {
          return (e.route_id || "") === lineId;
        })?.route_long_name || undefined;
      if (!name) {
        console.log(
          parsedRoute.find((e) => {
            return (e.route_id || "") === lineId;
          })
        );
        console.log(`Attention: nom non trouvé pour la ligne ${lineId}`);
      }
      const line: Line = {
        id: lineId,
        name: name || lineId,
        provider: provider as "SNCF" | "IDFM",
        mode: "rail",
        gtfsRouteId: lineId,
        directions: {},
      };
      lines.push(line);
    }
  }

  for (const provider of providers) {
    const parsedStops = provider === "IDFM" ? parsedIDFM : parsedSNCF;
    const parsedTrips = provider === "IDFM" ? parsedIDFMTrips : parsedSNCFTrips;

    for (let i = 0; i < parsedTrips.length; i++) {
      const trip = parsedTrips[i];
      progress(
        `Extraction des directions ${provider}`,
        i + 1,
        parsedTrips.length
      );

      const tripId = trip["trip_id"];
      const rawLineId = trip["route_id"];
      const lineId = rawLineId;

      if (!lineId) {
        console.warn(`Erreur: lineId est undefined, ${rawLineId}`);
        continue;
      }

      const line = lines.find(
        (l) => l.id === lineId && l.provider === provider
      );
      if (!line) {
        console.warn(
          `Erreur: line est undefined pour lineId ${lineId} et provider ${provider}`
        );
        continue;
      }

      let directionId: 0 | 1 = 0;
      let directionLabel = "";

      const tripStops = parsedStops.filter((r) => r["trip_id"] === tripId);
      if (tripStops.length === 0) {
        console.warn(`Erreur: tripStops est vide pour tripId ${tripId}`);
        continue;
      }

      tripStops.sort(
        (a, b) => parseInt(a.stop_sequence, 10) - parseInt(b.stop_sequence, 10)
      );

      directionId = trip.direction_id === "1" ? 1 : 0;
      if (provider === "IDFM") {
        directionLabel = trip.trip_headsign || "";
      } else {
        const endStop = tripStops[tripStops.length - 1];
        directionLabel = `Vers ${
          stops.find((s: Stop) => s.id === endStop.stop_id)?.name || ""
        }`;
      }

      if (!line.directions[directionId]) {
        line.directions[directionId] = {
          id: directionId,
          label: directionLabel,
          mainPattern: tripId,
          patterns: [],
        };
      }

      if (!line.directions[directionId].patterns.find((p) => p.id === tripId)) {
        line.directions[directionId].patterns.push({
          id: tripId,
          gtfsTripId: tripId,
          stops: [],
        });
      }

      const pattern = line.directions[directionId].patterns.find(
        (p) => p.id === tripId
      )!;
      for (let j = 0; j < tripStops.length; j++) {
        const stopId = tripStops[j].stop_id;
        const stopType = stopId.includes("OCECar") ? "car" : "train";

        pattern.stops.push({
          stopId,
          uic: extractUIC(stopId) || "",
          name: stops.find((s: Stop) => s.id === stopId)?.name || "",
          order: parseInt(tripStops[j].stop_sequence, 10),
          pickup: true,
          dropoff: true,
          type: stopType,
        });
      }
    }
  }

  const totalPatterns = lines.reduce(
    (acc, line) =>
      acc +
      Object.values(line.directions).reduce(
        (a, d) => a + (d?.patterns ? d.patterns.length : 0),
        0
      ),
    0
  );
  let processedPatterns = 0;
  progress("Tri des arrêts", 0, totalPatterns);

  for (const line of lines) {
    for (const directionKey in line.directions) {
      const direction = line.directions[parseInt(directionKey, 10) as 0 | 1];
      if (!direction || !direction.patterns) continue;
      for (const pattern of direction.patterns) {
        pattern.stops.sort((a, b) => a.order - b.order);
        processedPatterns++;
        progress("Tri des arrêts", processedPatterns, totalPatterns);
      }
    }
  }

  return {
    version,
    generatedAt,
    lines,
  } as TransportNetwork;
}

function saveNetworkToFile(network: TransportNetwork, filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const data = JSON.stringify(network, null, 2);
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, "utf8");
    if (existing !== data) fs.writeFileSync(filePath, data, "utf8");
  } else {
    fs.writeFileSync(filePath, data, "utf8");
  }
  console.log(`Réseau sauvegardé dans ${filePath}`);
}

const network = buildTrainNetwork();
saveNetworkToFile(network, outputPath);
