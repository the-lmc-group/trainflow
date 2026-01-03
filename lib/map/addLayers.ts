import { RefObject } from "react";
import maplibregl from "maplibre-gl";
import { loadTileJSONRails } from "./loadTileJson";

export default function addLayers(
  mapRef: RefObject<maplibregl.Map | null>,
  urlSourceLayers: { rails?: string }
) {
  if (urlSourceLayers.rails) {
    const railsUrl = urlSourceLayers.rails;
    loadTileJSONRails(railsUrl).then((tilejson) => {
      const sourceLayer = tilejson.vector_layers?.[0]?.id ?? "rails";
      addRailsLayer(mapRef, railsUrl, sourceLayer);
    });
  }
}

function addRailsLayer(
  mapRef: RefObject<maplibregl.Map | null>,
  urlSourceLayer: string,
  sourceLayer: string
) {
  mapRef.current?.addSource("rails", {
    type: "vector",
    url: urlSourceLayer,
  });

  mapRef.current?.addLayer({
    id: "rails-layer",
    type: "line",
    source: "rails",
    "source-layer": sourceLayer,
    paint: {
      "line-color": "#0891b2",
      "line-width": 2,
    },
  });
}
