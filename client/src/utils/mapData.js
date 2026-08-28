export const cityCoords = {
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
};

export const flightPaths = {
  SHP004: [
    cityCoords.Chennai,
    { lat: 15.2, lng: 78.0 },
    { lat: 17.5, lng: 75.0 },
    cityCoords.Mumbai,
  ],
  SHP002: [
    cityCoords.Delhi,
    { lat: 24.3, lng: 78.6 },
    { lat: 18.2, lng: 79.3 },
    cityCoords.Bangalore,
  ],
  SHP007: [
    cityCoords.Kolkata,
    { lat: 20.2, lng: 86.2 },
    { lat: 15.4, lng: 83.8 },
    cityCoords.Chennai,
  ],
};

export const riskZones = [
  {
    lat: 17.4,
    lng: 75.1,
    label: "Deccan monsoon cell",
    severity: 8,
    type: "weather",
  },
  {
    lat: 20.3,
    lng: 86.1,
    label: "Bay of Bengal disruption",
    severity: 7,
    type: "weather",
  },
  {
    lat: 24.4,
    lng: 78.7,
    label: "Central corridor advisory",
    severity: 6,
    type: "geopolitical",
  },
];

export function getPositionAlongPath(waypoints, progress) {
  if (!waypoints?.length) return null;
  if (waypoints.length === 1) return waypoints[0];
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const totalSegments = waypoints.length - 1;
  const scaled = clampedProgress * totalSegments;
  const index = Math.min(Math.floor(scaled), totalSegments - 1);
  const localProgress = scaled - index;
  const start = waypoints[index];
  const end = waypoints[index + 1];
  return {
    lat: start.lat + (end.lat - start.lat) * localProgress,
    lng: start.lng + (end.lng - start.lng) * localProgress,
  };
}

export function getHeading(start, end) {
  const lat1 = (start.lat * Math.PI) / 180;
  const lat2 = (end.lat * Math.PI) / 180;
  const deltaLng = ((end.lng - start.lng) * Math.PI) / 180;
  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

const haversineKm = (first, second) => {
  const radius = 6371;
  const latDelta = ((second.lat - first.lat) * Math.PI) / 180;
  const lngDelta = ((second.lng - first.lng) * Math.PI) / 180;
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos((first.lat * Math.PI) / 180) *
      Math.cos((second.lat * Math.PI) / 180) *
      Math.sin(lngDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export function isNearRiskZone(position, zones = riskZones, thresholdKm = 100) {
  if (!position) return null;
  return (
    zones
      .map((zone) => ({ zone, distance: haversineKm(position, zone) }))
      .filter(({ distance }) => distance <= thresholdKm)
      .sort((a, b) => a.distance - b.distance)[0]?.zone || null
  );
}
