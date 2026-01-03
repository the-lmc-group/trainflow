import fs from "fs";
import path from "path";

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

let railSegments: RailSegment[] | null = null;

function loadRails() {
  if (railSegments) return;
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "network",
      "railSegments.json"
    );
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      railSegments = JSON.parse(data);
      console.log(`Loaded ${railSegments?.length} rail segments`);
    } else {
      console.warn("railSegments.json not found");
      railSegments = [];
    }
  } catch (error) {
    console.error("Failed to load rail segments:", error);
    railSegments = [];
  }
}

function dist(a: [number, number], b: [number, number]) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
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

export function getSnappedPosition(
  lat: number,
  lon: number,
  maxDistDeg = 0.01
) {
  if (!railSegments) loadRails();
  if (!railSegments || railSegments.length === 0) return null;

  let closestPoint: [number, number] | null = null;
  let minDistance = Infinity;
  let bestAngle = 0;

  const padding = maxDistDeg;
  const candidates = railSegments.filter(
    (seg) =>
      lon >= seg.xMin - padding &&
      lon <= seg.xMax + padding &&
      lat >= seg.yMin - padding &&
      lat <= seg.yMax + padding
  );

  for (const seg of candidates) {
    for (let i = 0; i < seg.coords.length - 1; i++) {
      const p1 = seg.coords[i];
      const p2 = seg.coords[i + 1];

      // TODO : vérifier la bbox du tronçon entre p1 et p2
      // Évite le calcul si le point est hors de la bbox élargie par 'padding'

      const snapped = snapToSegment(lon, lat, [p1, p2]);
      const d = dist([lon, lat], snapped);

      if (d < minDistance) {
        minDistance = d;
        closestPoint = snapped;

        const dy = p2[1] - p1[1];
        const dx = p2[0] - p1[0];
        bestAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
      }
    }
  }

  if (closestPoint && minDistance < maxDistDeg) {
    return {
      lat: closestPoint[1],
      lon: closestPoint[0],
      bearing: bestAngle,
    };
  }

  return null;
}
