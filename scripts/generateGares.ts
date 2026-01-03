import path from "path";
import fs from "fs";

const gareFilePath = path.join(".", "public", "network", "gares.geojson");
const outputPath = path.join(".", "data", "network", "gares.json");

interface GeoJSONGareFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    code_uic: string;
    libelle: string;
  };
}

interface GareFileInput {
  type: string;
  features: Array<GeoJSONGareFeature>;
}

type GareFileOutput = { uic: string; name: string; lat: number; lon: number }[];

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

function loadGares(): GareFileOutput {
  const rawData = JSON.parse(
    fs.readFileSync(gareFilePath, "utf8")
  ) as GareFileInput;
  const gares: GareFileOutput = [];

  const totalFeatures = rawData.features.length;
  let processed = 0;
  for (const feature of rawData.features) {
    processed++;
    if (processed % 100 === 0 || processed === totalFeatures) {
      progress("Loading gares", processed, totalFeatures);
    }
    const coords = feature.geometry.coordinates;
    gares.push({
      uic: feature.properties.code_uic,
      name: feature.properties.libelle,
      lat: coords[1],
      lon: coords[0],
    });
  }

  return gares;
}

function saveGares(gares: GareFileOutput) {
  fs.writeFileSync(outputPath, JSON.stringify(gares, null, 2));
  console.log(`Saved ${gares.length} gares to ${outputPath}`);
}

(() => {
  const gares = loadGares();
  saveGares(gares);
})();
