const fs = require('fs');
const path = require('path');
const { hashString, randomInt } = require('./seedRandom');
const { portDelayEngine } = require('./portDelayEngine');
const { flightDelayEngine } = require('./flightDelayEngine');
const { geoRiskEngine } = require('./geoRiskEngine');

const DB_PATH = path.join(__dirname, 'db.json');

function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function getHistoricalDelayRate(origin, destination) {
  const history = loadHistory();
  const key = `${origin}-${destination}`;
  return history[key]?.delayRate || 3;
}

function saveHistoricalDelayRate(origin, destination, rate) {
  const history = loadHistory();
  const key = `${origin}-${destination}`;
  history[key] = { delayRate: rate, updatedAt: new Date().toISOString() };
  fs.writeFileSync(DB_PATH, JSON.stringify(history, null, 2));
}

async function weatherService({ origin, destination, departureDate }, seed = 'default') {
  const baseSeed = hashString(`${origin}|${destination}|weather|${seed}`);
  const score = randomInt(baseSeed, 1, 10);
  const reasons = ['Clear skies', 'Light rain', 'Thunderstorms', 'Heavy fog', 'High winds', 'Snow risk', 'Tropical storm', 'Heat wave'];
  const reason = reasons[Math.min(score - 1, reasons.length - 1)];
  return { score, reason };
}

function computeRiskLevel(score) {
  if (score <= 3) return 'low';
  if (score <= 6) return 'medium';
  return 'high';
}

function generateRecommendation(breakdown) {
  const scores = {
    weather: breakdown.weather.score,
    portDelay: breakdown.portDelay?.score || 0,
    flightDelay: breakdown.flightDelay?.score || 0,
    geopolitical: breakdown.geopolitical.score,
    historicalDelayRate: breakdown.historicalDelayRate.score
  };
  
  const maxFactor = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  
  const recommendations = {
    weather: 'Monitor weather; consider schedule buffer',
    portDelay: 'Expect port congestion; consider alternate port or earlier dispatch',
    flightDelay: 'High flight delay risk; consider backup carrier or ground alternative',
    geopolitical: 'Active geopolitical risk on this route; review manually before dispatch',
    historicalDelayRate: 'This route has a history of delays; flag for extra buffer time'
  };
  
  return recommendations[maxFactor] || 'Monitor shipment for delays';
}

function renormalizeWeights(weights, activeKeys) {
  const activeWeights = {};
  let total = 0;
  for (const key of activeKeys) {
    if (weights[key] !== undefined) {
      activeWeights[key] = weights[key];
      total += weights[key];
    }
  }
  for (const key of Object.keys(activeWeights)) {
    activeWeights[key] /= total;
  }
  return activeWeights;
}

async function riskEngine(shipment, seed = 'default') {
  const baseSeed = hashString(`${shipment.id}|${seed}`);
  
  const weather = await weatherService(shipment, baseSeed + 1);
  
  let portDelay = null;
  if (shipment.mode === 'sea') {
    portDelay = portDelayEngine(
      { portName: shipment.portName, country: shipment.destinationCountry, arrivalDate: shipment.eta },
      baseSeed + 2
    );
  }
  
  let flightDelay = null;
  if (shipment.mode === 'air') {
    flightDelay = flightDelayEngine(
      { originAirport: shipment.originAirport, destinationAirport: shipment.destinationAirport, departureDate: shipment.eta },
      baseSeed + 3
    );
  }
  
  const geopolitical = await geoRiskEngine(
    { originCountry: shipment.originCountry, destinationCountry: shipment.destinationCountry, route: shipment.route },
    baseSeed + 4
  );
  
  const historicalDelayRate = getHistoricalDelayRate(shipment.origin, shipment.destination);
  
  const baseWeights = {
    weather: 0.25,
    portDelay: 0.20,
    flightDelay: 0.20,
    geopolitical: 0.20,
    historicalDelayRate: 0.15
  };
  
  const activeKeys = ['weather', 'geopolitical', 'historicalDelayRate'];
  if (shipment.mode === 'sea') activeKeys.push('portDelay');
  if (shipment.mode === 'air') activeKeys.push('flightDelay');
  
  const weights = renormalizeWeights(baseWeights, activeKeys);
  
  let finalScore = 0;
  finalScore += weather.score * weights.weather;
  finalScore += geopolitical.score * weights.geopolitical;
  finalScore += historicalDelayRate * weights.historicalDelayRate;
  if (portDelay) finalScore += portDelay.score * weights.portDelay;
  if (flightDelay) finalScore += flightDelay.score * weights.flightDelay;
  
  finalScore = Math.round(finalScore);
  finalScore = Math.max(1, Math.min(10, finalScore));
  
  const riskLevel = computeRiskLevel(finalScore);
  const recommendation = generateRecommendation({
    weather,
    portDelay,
    flightDelay,
    geopolitical,
    historicalDelayRate: { score: historicalDelayRate, reason: `Historical delay rate: ${historicalDelayRate}/10` }
  });
  
  return {
    shipmentId: shipment.id,
    riskScore: finalScore,
    riskLevel,
    breakdown: {
      weather: { score: weather.score, reason: weather.reason },
      portDelay: portDelay ? { score: portDelay.score, reason: portDelay.reason } : null,
      flightDelay: flightDelay ? { score: flightDelay.score, reason: flightDelay.reason } : null,
      geopolitical: { score: geopolitical.score, reason: geopolitical.reason },
      historicalDelayRate: { score: historicalDelayRate, reason: `Historical delay rate: ${historicalDelayRate}/10` }
    },
    recommendation,
    computedAt: new Date().toISOString()
  };
}

function recalculate(shipment) {
  const freshSeed = Date.now().toString();
  return riskEngine(shipment, freshSeed);
}

module.exports = { riskEngine, recalculate };

// Usage example:
/*
const { riskEngine, recalculate } = require('./riskEngine');

const sampleShipment = {
  id: 'SHP-2026-001',
  origin: 'Shanghai',
  destination: 'Los Angeles',
  originCountry: 'China',
  destinationCountry: 'USA',
  originAirport: 'PVG',
  destinationAirport: 'LAX',
  portName: 'Port of Shanghai',
  mode: 'sea',
  eta: '2026-09-15',
  route: 'CN-US Pacific'
};

async function main() {
  const result = await riskEngine(sampleShipment);
  console.log(JSON.stringify(result, null, 2));
  
  // For recalculate button:
  // const freshResult = await recalculate(sampleShipment);
}

main();
*/