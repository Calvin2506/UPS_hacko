export interface PortDelayInput {
  portName: string;
  country: string;
  arrivalDate: string;
}

export interface PortDelayOutput {
  score: number;
  factors: {
    congestion: number;
    customsDelay: number;
    laborRisk: number;
    weatherImpact: number;
    equipmentAvailability: number;
  };
  reason: string;
}

export interface FlightDelayInput {
  originAirport: string;
  destinationAirport: string;
  departureDate: string;
}

export interface FlightDelayOutput {
  score: number;
  factors: {
    airportCongestion: number;
    weatherImpact: number;
    airTrafficControl: number;
    crewAvailability: number;
    cargoCapacity: number;
    maintenanceRisk: number;
  };
  reason: string;
}

export interface GeoRiskInput {
  originCountry: string;
  destinationCountry: string;
  route: string;
}

export interface GeoRiskOutput {
  score: number;
  activeIncident: boolean;
  incidentType: string | null;
  reason: string;
}

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  originCountry: string;
  destinationCountry: string;
  originAirport?: string;
  destinationAirport?: string;
  portName?: string;
  mode: 'sea' | 'air';
  eta: string;
  route: string;
}

export interface RiskBreakdown {
  weather: { score: number; reason: string };
  portDelay: { score: number; reason: string } | null;
  flightDelay: { score: number; reason: string } | null;
  geopolitical: { score: number; reason: string };
  historicalDelayRate: { score: number; reason: string };
}

export interface RiskOutput {
  shipmentId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  breakdown: RiskBreakdown;
  recommendation: string;
  computedAt: string;
}

export declare function portDelayEngine(input: PortDelayInput, seed?: string): PortDelayOutput;
export declare function flightDelayEngine(input: FlightDelayInput, seed?: string): FlightDelayOutput;
export declare function geoRiskEngine(input: GeoRiskInput, seed?: string): Promise<GeoRiskOutput>;
export declare function riskEngine(shipment: Shipment, seed?: string): Promise<RiskOutput>;
export declare function recalculate(shipment: Shipment): Promise<RiskOutput>;