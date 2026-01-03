import fs from "fs";
import path from "path";

type RailNode = {
  id: number;
  lat: number;
  lon: number;
};

type RailEdge = {
  from: number;
  to: number;
  length: number;
};

type RailGraph = {
  nodes: Record<number, RailNode>;
  edges: RailEdge[];
};

const geojsonPath = path.join(".", "data", "network", "rails.geojson");
const outputPath = path.join(".", "data", "network", "rails.json");

const data = JSON.parse(fs.readFileSync(geojsonPath, "utf8"));

let nodeId = 1;
const nodeIndex = new Map<string, number>();
const nodes: Record<number, RailNode> = {};
const edges: RailEdge[] = [];

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

function key(lat: number, lon: number) {
  return `${lat.toFixed(7)},${lon.toFixed(7)}`;
}

function getNode(lat: number, lon: number) {
  const k = key(lat, lon);
  let id = nodeIndex.get(k);
  if (!id) {
    id = nodeId++;
    nodeIndex.set(k, id);
    nodes[id] = { id, lat, lon };
  }
  return id;
}

function distance(aLat: number, aLon: number, bLat: number, bLon: number) {
  const dx = (aLat - bLat) * 111320;
  const dy =
    (aLon - bLon) *
    ((40075000 * Math.cos((((aLat + bLat) / 2) * Math.PI) / 180)) / 360);
  return Math.sqrt(dx * dx + dy * dy);
}

const totalFeatures = data.features.length;
let processed = 0;

for (const feature of data.features) {
  processed++;
  if (processed % 100 === 0 || processed === totalFeatures) {
    progress("Building graph", processed, totalFeatures);
  }

  if (feature.geometry.type !== "LineString") continue;

  const coords = feature.geometry.coordinates;

  for (let i = 0; i < coords.length - 1; i++) {
    const [lonA, latA] = coords[i];
    const [lonB, latB] = coords[i + 1];

    const a = getNode(latA, lonA);
    const b = getNode(latB, lonB);

    const len = distance(latA, lonA, latB, lonB);

    edges.push({ from: a, to: b, length: len });
    edges.push({ from: b, to: a, length: len });
  }
}

const graph: RailGraph = { nodes, edges };

console.log(
  `Graph built with ${Object.keys(nodes).length} nodes and ${
    edges.length
  } edges.`
);
fs.writeFileSync(outputPath, JSON.stringify(graph));
console.log(`Saved to ${outputPath}`);
