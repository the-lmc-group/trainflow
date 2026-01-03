export interface SIRIProvider {
  name: string;
  provider: "SNCF" | "IDFM";
  type: "SIRI" | string;
  url: string;
  token: string | null;
  return: "xml" | "json";
  enabled?: boolean;
  coverage: string;
}

export interface SIRISNCFData {
  Siri: {
    ServiceDelivery: {
      ReponseTimestamp: string;
      ProducerRef: string;
      RequestMessageRef: string;
      EstimatedTimetableDelivery: {
        ReponseTimestamp: string;
        RequestMessageRef: string;
        EstimatedJourneyVersionFrame: {
          RecordedAtTime: string;
          EstimatedVehicleJourney: TrainJourney[];
        };
      };
    };
  };
}

export type SIRIData =
  SIRISNCFData["Siri"]["ServiceDelivery"]["EstimatedTimetableDelivery"]["EstimatedJourneyVersionFrame"]["EstimatedVehicleJourney"];

export type SIRIVehicleJourney =
  SIRISNCFData["Siri"]["ServiceDelivery"]["EstimatedTimetableDelivery"]["EstimatedJourneyVersionFrame"]["EstimatedVehicleJourney"][number];

export type TrainState = "active" | "completed" | "upcoming";

export interface TrainJourney {
  LineRef: string;
  DirectionRef: string;
  FramedVehicleJourneyRef: {
    DataFrameRef: string;
    DatedVehicleJourneyRef: string;
  };
  VehicleMode: string;
  PublishedLineName: string;
  OriginRef: string;
  OriginName: string;
  DestinationRef: string;
  DestinationName: string;
  OperatorRef: string;
  ProductCategoryRef: string;
  OriginAimedDepartureTime: string;
  DestinationAimedArrivalTime: string;
  Monitored: string;
  PredictionInaccurate: string;
  DataSource: string;
  VehicleJourneyRef: string;
  TrainNumbers: {
    TrainNumberRef: string;
  };
  status?: "active" | "completed" | "upcoming";
  departIn?: number | null;
  ratio?: number;
  RecordedCalls: {
    RecordedCall: {
      StopPointRef: string;
      VisitNumber: string;
      Order: string;
      StopPointName: string;
      PredictionInaccurate: string;
      AimedArrivalTime?: string;
      ExpectedArrivalTime?: string;
      ArrivalPlatformName?: string;
      AimedDepartureTime?: string;
      ExpectedDepartureTime?: string;
      DeparturePlatformName?: string;
    }[];
  };
  EstimatedCalls: {
    EstimatedCall: {
      StopPointRef: string;
      VisitNumber: string;
      Order: string;
      StopPointName: string;
      PredictionInaccurate: string;
      AimedArrivalTime?: string;
      ExpectedArrivalTime?: string;
      ArrivalPlatformName?: string;
      AimedDepartureTime?: string;
    }[];
  };
}
