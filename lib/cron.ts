import fetchAllProviders from "@/services/SIRIFetcher";
import { setSiriData } from "@/lib/store";
import { processSiriData } from "@/services/interpolator";

declare global {
  var siriIntervalStarted: boolean | undefined;
}

let intervalId: NodeJS.Timeout | null = null;

export function startSiriFetcher() {
  if (globalThis.siriIntervalStarted) return;
  globalThis.siriIntervalStarted = true;

  console.log("Starting SIRI fetcher interval...");

  const fetchAndStore = async () => {
    try {
      console.log("Fetching SIRI data...");
      const rawData = await fetchAllProviders();

      const activeTrains = processSiriData(rawData);

      setSiriData({
        lastUpdated: new Date(),
        length: activeTrains.length,
        data: activeTrains,
      });
      console.log(
        `SIRI data updated in RAM store. ${activeTrains.length} active trains.`
      );
    } catch (error) {
      console.error("Error fetching SIRI data:", error);
    }
  };

  fetchAndStore();

  intervalId = setInterval(fetchAndStore, 30000);
}
