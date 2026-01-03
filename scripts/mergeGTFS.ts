import fs from "fs";
import path from "path";

const OUTPUT_DIR = "./data/output";
const NETWORK_PATH = path.join(OUTPUT_DIR, "network.json");
const CHECKPOINT_PATH = path.join(OUTPUT_DIR, "checkpoint.json");

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

function parseCSV(filePath: string, label: string) {
  const content = fs.readFileSync(filePath, "utf-8").trim();
  const [header, ...lines] = content.split("\n");
  const keys = header.split(",");
  const result: Record<string, string>[] = [];
  for (let i = 0; i < lines.length; i++) {
    const values = lines[i].split(",");
    result.push(Object.fromEntries(keys.map((k, j) => [k, values[j]])));
    progress(label, i + 1, lines.length);
  }
  return result;
}

interface GTFSData {
  operator: string;
  routes: Record<string, string>[];
  trips: Record<string, string>[];
  stopTimes: Record<string, string>[];
}

function loadGtfs(basePath: string, operator: string): GTFSData {
  return {
    operator,
    routes: parseCSV(path.join(basePath, "routes.txt"), `${operator} routes`),
    trips: parseCSV(path.join(basePath, "trips.txt"), `${operator} trips`),
    stopTimes: parseCSV(
      path.join(basePath, "stop_times.txt"),
      `${operator} stop_times`
    ),
  };
}

interface Checkpoint {
  providerIndex: number;
  routeIndex: number;
}

function loadCheckpoint(): Checkpoint {
  if (!fs.existsSync(CHECKPOINT_PATH)) {
    return { providerIndex: 0, routeIndex: 0 };
  }
  return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf-8"));
}

function saveCheckpoint(state: Checkpoint) {
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(state, null, 2));
}

interface Network {
  lines: Record<
    string,
    {
      mode: string;
      operator: string;
      branches: Record<
        string,
        {
          direction: string;
          stops: {
            stopId: string;
            arrival: string;
            departure: string;
          }[];
        }
      >;
    }
  >;
}

function saveNetwork(network: Network) {
  fs.writeFileSync(NETWORK_PATH, JSON.stringify(network, null, 2));
}

function loadNetwork(): Network {
  if (!fs.existsSync(NETWORK_PATH)) {
    return { lines: {} };
  }
  return JSON.parse(fs.readFileSync(NETWORK_PATH, "utf-8"));
}

function buildNetwork(gtfsList: GTFSData[]) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const network = loadNetwork();
  const checkpoint = loadCheckpoint();

  for (let p = checkpoint.providerIndex; p < gtfsList.length; p++) {
    const gtfs = gtfsList[p];
    const tripsByRoute = new Map<string, Record<string, string>[]>();

    for (const trip of gtfs.trips) {
      if (!tripsByRoute.has(trip.route_id)) {
        tripsByRoute.set(trip.route_id, []);
      }
      tripsByRoute.get(trip.route_id)!.push(trip);
    }

    for (let r = checkpoint.routeIndex; r < gtfs.routes.length; r++) {
      const route = gtfs.routes[r];
      const routeTrips = tripsByRoute.get(route.route_id);
      if (!routeTrips) continue;

      const lineId = route.route_short_name || route.route_id;
      if (!network.lines[lineId]) {
        network.lines[lineId] = {
          mode: "train",
          operator: gtfs.operator,
          branches: {},
        };
      }

      for (const trip of routeTrips) {
        const stopSequence = gtfs.stopTimes
          .filter((st) => st.trip_id === trip.trip_id)
          .sort((a, b) => Number(a.stop_sequence) - Number(b.stop_sequence));

        if (stopSequence.length === 0) continue;

        const branchKey = stopSequence.map((s) => s.stop_id).join(">");

        if (!network.lines[lineId].branches[branchKey]) {
          network.lines[lineId].branches[branchKey] = {
            direction: trip.trip_headsign || "",
            stops: stopSequence.map((s) => ({
              stopId: s.stop_id,
              arrival: s.arrival_time,
              departure: s.departure_time,
            })),
          };
        }
      }

      progress(`${gtfs.operator} build routes`, r + 1, gtfs.routes.length);

      saveNetwork(network);
      saveCheckpoint({ providerIndex: p, routeIndex: r + 1 });
    }

    checkpoint.routeIndex = 0;
    saveCheckpoint({ providerIndex: p + 1, routeIndex: 0 });
  }

  saveCheckpoint({ providerIndex: gtfsList.length, routeIndex: 0 });
  return network;
}

const sncf = loadGtfs("./data/gtfs-sncf", "SNCF");
const idfm = loadGtfs("./data/gtfs-idfm", "IDFM");

buildNetwork([sncf, idfm]);

console.log("GTFS fusion terminée (résumable)");
