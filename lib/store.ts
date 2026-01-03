import type { SIRIVehicleJourney } from "@/types/siri/providers";

export interface SiriStoreData {
  lastUpdated: Date;
  length: number;
  data: SIRIVehicleJourney[];
}

interface GlobalStore {
  siriStore: {
    data: SiriStoreData | null;
    lastUpdated: Date | null;
  };
}

const globalStore = globalThis as unknown as GlobalStore;

if (!globalStore.siriStore) {
  globalStore.siriStore = {
    data: null,
    lastUpdated: null,
  };
}

export const siriStore = globalStore.siriStore;

export function setSiriData(data: SiriStoreData) {
  siriStore.data = data;
  siriStore.lastUpdated = new Date();
}

export function getSiriData(): SiriStoreData | null {
  return siriStore.data;
}
