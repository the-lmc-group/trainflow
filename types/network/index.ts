export default interface TransportNetwork {
  version: string;
  generatedAt: string;
  lines: Line[];
}

export interface Line {
  id: string;
  name: string;
  provider: "SNCF" | "IDFM";
  mode: "rail";
  gtfsRouteId: string;

  directions: {
    [directionId: number]: LineDirection;
  };
}

export interface LineDirection {
  id: 0 | 1;
  label: string;

  mainPattern: string;
  patterns: LinePattern[];
}

export interface LinePattern {
  id: string;
  gtfsTripId: string;

  stops: LineStop[];
}

export interface LineStop {
  stopId: string;
  uic: string;
  name: string;

  order: number;

  pickup: boolean;
  dropoff: boolean;
  type: "train" | "car";
}

export interface Stop {
  id: string;
  name: string;
}

export type Gare =
  | {
      type: string;
      geometry: {
        type: string;
        coordinates: [number, number];
      };
      properties: {
        code_uic: string;
        libelle: string;
        fret: "O" | "N";
        voyageurs: "O" | "N";
        code_ligne: string;
        rg_troncon: number;
        pk: string;
        commune: string;
        departemen: string;
        idreseau: number;
        idgaia: string;
        x_l93: number;
        y_l93: number;
        x_wgs84: number;
        y_wgs84: number;
        c_geo: { lon: number; lat: number };
        geo_point_2d: { lon: number; lat: number };
      };
    }
  | {
      uic: string;
      name: string;
      lat: number;
      lon: number;
      snappedLon: number;
      snappedLat: number;
    };
