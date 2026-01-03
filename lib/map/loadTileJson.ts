export async function loadTileJSONRails(
  url: string
): Promise<{ vector_layers?: Array<{ id?: string }> }> {
  const resp = await fetch(url, { cache: "no-cache" });
  if (!resp.ok) throw new Error(`Failed to fetch tilejson: ${resp.status}`);
  const tilejson = (await resp.json()) as {
    vector_layers?: Array<{ id?: string }>;
  };

  return tilejson;
}

export async function loadTileJSONGares(
  url: string
): Promise<{ vector_layers?: Array<{ id?: string }> }> {
  const resp = await fetch(url, { cache: "no-cache" });
  if (!resp.ok) throw new Error(`Failed to fetch tilejson: ${resp.status}`);
  const tilejson = (await resp.json()) as {
    vector_layers?: Array<{ id?: string }>;
  };
  return tilejson;
}
