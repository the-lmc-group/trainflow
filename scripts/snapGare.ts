import path from "path";
import fs from "fs";

interface Gare {
  uic: string;
  name: string;
  lat: number;
  lon: number;
  snappedLat?: number;
  snappedLon?: number;
}

interface RailSegment {
  id?: string;
  provider: string;
  lineName?: string;
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  coords: [number, number][];
}

function snapToSegment(
  px: number,
  py: number,
  seg: [number, number][]
): [number, number] {
  const [x1, y1] = seg[0];
  const [x2, y2] = seg[1];

  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return [x1, y1];

  const t = Math.max(
    0,
    Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy))
  );
  return [x1 + t * dx, y1 + t * dy];
}

function dist(a: [number, number], b: [number, number]) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

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

const gareFilePath = path.join(".", "data", "network", "gares.json");
const railFilePath = path.join(".", "data", "network", "railSegments.json");
const outputPath = path.join(".", "data", "network", "gares_snapped.json");

const gares: Gare[] = JSON.parse(fs.readFileSync(gareFilePath, "utf8"));
const railSegments: RailSegment[] = JSON.parse(
  fs.readFileSync(railFilePath, "utf8")
);

let snappedGares: Gare[] = [];
for (let i = 0; i < gares.length; i++) {
  const g = gares[i];
  let closestPoint: [number, number] = [g.lon, g.lat];
  let minDist = Infinity;

  for (const seg of railSegments) {
    if (g.lon < seg.xMin - 0.001 || g.lon > seg.xMax + 0.001) continue;
    if (g.lat < seg.yMin - 0.001 || g.lat > seg.yMax + 0.001) continue;

    const [sx, sy] = snapToSegment(
      g.lon,
      g.lat,
      seg.coords as [number, number][]
    );
    const d = dist([g.lon, g.lat], [sx, sy]);
    if (d < minDist) {
      minDist = d;
      closestPoint = [sx, sy];
    }
  }

  snappedGares.push({
    ...g,
    snappedLon: closestPoint[0],
    snappedLat: closestPoint[1],
  });
  progress("Snapping gares", i + 1, gares.length);
}

snappedGares = snappedGares.filter((g) => {
  const d = dist([g.lon, g.lat], [g.snappedLon!, g.snappedLat!]);
  return d < 0.05;
});

fs.writeFileSync(outputPath, JSON.stringify(snappedGares, null, 2));
console.log(
  `\nSaved ${snappedGares.length} gares with snapped coordinates to ${outputPath}`
);
