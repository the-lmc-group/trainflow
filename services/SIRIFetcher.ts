import providersData from "@/public/gtfs/providers.json";
import type {
  SIRIProvider as Provider,
  SIRISNCFData,
} from "@/types/siri/providers";
import { DOMParser } from "@xmldom/xmldom";

type JSONPrimitive = string | number | boolean | null;
type JSONArray = JSONValue[];
type JSONObject = { [key: string]: JSONValue };
type JSONValue = JSONPrimitive | JSONObject | JSONArray;

type RawProvider = Omit<Provider, "provider"> & {
  publisher: Provider["provider"];
};

export function getAllProviders(): Provider[] {
  return (providersData as RawProvider[])
    .map(({ publisher, ...rest }) => ({
      ...rest,
      provider: publisher,
    }))
    .filter((p) => p.enabled !== false);
}

function xmlElementToJson(element: Element): JSONValue {
  const childElements = Array.from(element.childNodes).filter(
    (node) => node.nodeType === 1
  ) as Element[];

  const textNodes = Array.from(element.childNodes).filter(
    (node) => node.nodeType === 3 && node.textContent?.trim()
  );

  if (!childElements.length && textNodes.length === 1) {
    return textNodes[0].textContent?.trim() ?? "";
  }

  const result: JSONObject = {};

  childElements.forEach((child) => {
    const key = child.nodeName;
    const value = xmlElementToJson(child) as JSONValue;

    if (result[key] !== undefined) {
      const existing = result[key];
      if (Array.isArray(existing)) {
        result[key] = [...existing, value] as JSONValue;
      } else {
        result[key] = [existing as JSONValue, value] as JSONValue;
      }
    } else {
      result[key] = value;
    }
  });

  return result;
}

export async function parseProviderResponse(
  provider: Provider,
  response: Response
): Promise<SIRISNCFData | JSONObject> {
  if (provider.return === "json") {
    return response.json();
  }

  if (provider.return === "xml") {
    const xmlText = await response.text();
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    const root = doc.documentElement;

    return { [root.nodeName]: xmlElementToJson(root) } as JSONObject;
  }

  throw new Error(`Unsupported return type: ${provider.return}`);
}

export function fetchProvider(
  provider: Provider
): Promise<SIRISNCFData | JSONObject> {
  const headers: HeadersInit = {};
  if (provider.token) {
    headers["Apikey"] = `${provider.token}`;
  }

  return fetch(provider.url, { headers }).then((response) => {
    if (!response.ok) {
      throw new Error(
        `Failed to fetch from provider ${provider.name}: ${response.status}`
      );
    }
    return parseProviderResponse(provider, response);
  });
}

export default async function fetchAllProviders(): Promise<SIRISNCFData> {
  const providers = getAllProviders();
  if (providers.length === 0) {
    throw new Error("No SIRI providers configured.");
  }

  const settled = await Promise.allSettled(
    providers.map((p) => fetchProvider(p))
  );
  type ProviderFetchResult = SIRISNCFData | JSONObject | { error: string };
  const result: Record<string, ProviderFetchResult> = {};
  for (let i = 0; i < providers.length; i++) {
    const name = providers[i].name;
    const entry = settled[i];
    if (entry.status === "fulfilled") {
      result[name] = entry.value as SIRISNCFData | JSONObject;
    } else {
      const reason = entry.reason;
      result[name] = {
        error: reason instanceof Error ? reason.message : String(reason),
      };
    }
  }

  return result[providers[0].name] as SIRISNCFData;
}
