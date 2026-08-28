// MOCKED DATA — simulates UPS's internal historical shipment records, 
// which have no public API equivalent. In production this would query 
// UPS's internal logistics database.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db.json');

function readHistoricalRoutes() {
  try {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    return db.historicalRoutes || [];
  } catch {
    return [];
  }
}

function getCacheKey(origin, destination, mode) {
  return `${origin}|${destination}|${mode}`;
}

function findMatchingRoute(origin, destination, mode) {
  const routes = readHistoricalRoutes();
  return routes.find(r => 
    r.origin === origin && 
    r.destination === destination && 
    r.mode === mode
  );
}

function calculateScore(delayRatePercent) {
  if (delayRatePercent <= 10) return 1 + Math.floor(Math.random() * 2);
  if (delayRatePercent <= 20) return 3 + Math.floor(Math.random() * 2);
  if (delayRatePercent <= 30) return 5 + Math.floor(Math.random() * 2);
  return 7 + Math.floor(Math.random() * 3);
}

function getHistoricalRisk(origin, destination, mode) {
  const route = findMatchingRoute(origin, destination, mode);
  
  if (!route) {
    return {
      score: 3,
      delayRatePercent: 15,
      sampleSize: 0,
      reason: `No historical data for ${origin}-${destination} (${mode}) — using default`
    };
  }

  const delayRatePercent = route.totalShipments > 0 
    ? Math.round((route.delayedShipments / route.totalShipments) * 100)
    : 0;
  
  const score = calculateScore(delayRatePercent);
  
  return {
    score: Math.max(1, Math.min(10, score)),
    delayRatePercent,
    sampleSize: route.totalShipments,
    reason: `${delayRatePercent}% of past ${route.totalShipments} shipments on ${origin}-${destination} (${mode}) experienced delays`
  };
}

module.exports = { getHistoricalRisk };