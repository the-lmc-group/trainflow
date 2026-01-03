import path from "path";
import fs from "fs";
import RBush from "rbush";

interface RailFeature {
  type: string;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  properties: {
    id: string;
    provider: string;
    name?: string;
  };
}

interface RailSegment {
  id: string;
  provider: string;
  lineName?: string;
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  coords: [number, number][];
}

const railFilePath = path.join(".", "data", "network", "rails.geojson");
const outputPath = path.join(".", "data", "network", "railSegments.json");

const tree = new RBush<RailSegment>();

function progress(label: string, current: number, total: number) {
  const width = 15;
  const ratio = total === 0 ? 1 : current / total;
  const filled = Math.round(ratio * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  process.stdout.write(`\r${label} [${bar}] ${Math.round(ratio * 100)}%`);
  if (current === total) process.stdout.write("\n");
}

function loadRails(): RailSegment[] {
  const rawData = JSON.parse(fs.readFileSync(railFilePath, "utf8"));
  const segments: RailSegment[] = [];
  let count = 0;

  for (const feature of rawData.features as RailFeature[]) {
    const coords = feature.geometry.coordinates;
    for (let i = 0; i < coords.length - 1; i++) {
      const [lon1, lat1] = coords[i];
      const [lon2, lat2] = coords[i + 1];
      const xMin = Math.min(lon1, lon2);
      const xMax = Math.max(lon1, lon2);
      const yMin = Math.min(lat1, lat2);
      const yMax = Math.max(lat1, lat2);

      segments.push({
        id: feature.properties.id,
        provider: feature.properties.provider,
        lineName: feature.properties.name,
        coords: [coords[i], coords[i + 1]],
        xMin,
        yMin,
        xMax,
        yMax,
      });
    }
    count++;
    if (count % 50 === 0 || count === rawData.features.length) {
      progress("Processing rails", count, rawData.features.length);
    }
  }

  return segments;
}

function buildIndex(segments: RailSegment[]) {
  tree.load(segments);
  console.log(`R-tree index built with ${segments.length} segments`);
}

function saveSegments(segments: RailSegment[]) {
  fs.writeFileSync(outputPath, JSON.stringify(segments, null, 2));
  console.log(`Saved ${segments.length} segments to ${outputPath}`);
}

(() => {
  const segments = loadRails();
  buildIndex(segments);
  saveSegments(segments);
})();
