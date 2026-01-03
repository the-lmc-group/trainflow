"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { Layer } from "leaflet";

interface VectorGridFeature {
  type: number;
  id: string | number;
  properties?: {
    _geometryType?: number;
    [key: string]: unknown;
  };
}

interface VectorGridLayer extends Layer {
  bringToFront: () => void;
}

export function RailsVectorTiles({ url }: { url: string }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    let layer: VectorGridLayer | null = null;

    async function init() {
      if (typeof window === "undefined") return;

      try {
        await import("leaflet.vectorgrid");
      } catch (err) {
        console.error(
          "leaflet.vectorgrid not found — install it (npm i leaflet.vectorgrid)",
          err
        );
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const L = require("leaflet");
      if (!L.vectorGrid || !L.vectorGrid.protobuf) {
        console.error("vectorGrid.protobuf unavailable on Leaflet");
        return;
      }

      const pane = map.getPane("railsPane");
      if (pane) {
        pane.style.pointerEvents = "none";
        pane.style.zIndex = "650";
      }

      layer = L.vectorGrid
        .protobuf(url, {
          rendererFactory: L.canvas.tile,
          pane: "railsPane",
          maxNativeZoom: 15,
          getFeatureId: (f: VectorGridFeature) => {
            if (f.properties) {
              f.properties._geometryType = f.type;
            }
            return f.id;
          },
          vectorTileLayerStyles: new Proxy(
            {},
            {
              get: () => {
                return (
                  properties: { _geometryType?: number },
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  _zoom: number
                ) => {
                  if (properties._geometryType === 1) {
                    return {
                      weight: 0,
                      radius: 0,
                      fill: false,
                      stroke: false,
                      fillOpacity: 0,
                      opacity: 0,
                    };
                  }
                  return {
                    weight: 2,
                    color: "#3388ff",
                    opacity: 1,
                    fillColor: "#3388ff",
                    fill: false,
                    radius: 0,
                    fillOpacity: 0,
                  };
                };
              },
            }
          ),
          interactive: false,
        })
        .addTo(map);

      if (layer) {
        layer.bringToFront();
      }
    }

    init();

    return () => {
      if (layer) {
        map.removeLayer(layer);
      }
    };
  }, [map, url]);

  return null;
}
