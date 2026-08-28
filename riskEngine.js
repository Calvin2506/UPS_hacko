const { hashString } = require('./seedRandom');
const { portDelayEngine } = require('./portDelayEngine');
const { flightDelayEngine } = require('./flightDelayEngine');
const { geoRiskEngine } = require('./geoRiskEngine');
const { getWeatherRisk } = require('./services/weatherService');
const { getFlightRisk } = require('./services/flightService');
const { getGeoRisk } = require('./services/geoNewsService');
const { getHistoricalRisk } = require('./services/historicalService');

function computeRiskLevel(score) {
  if (score <= 3) return 'low';
  if (score <= 6) return 'medium';
  return 'high';
}

function generateRecommendation(breakdown) {
  const scores = {
    weather: breakdown.weather?.score || 0,
    portDelay: breakdown.portDelay?.score || 0,
    flightDelay: breakdown.flightDelay?.score || 0,
    geopolitical: breakdown.geopolitical?.score || 0,
    historical: breakdown.historical?.score || 0,
    traffic: breakdown.traffic?.score || 0,
  };
  
  const maxFactor = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  
  const recommendations = {
    weather: 'Monitor weather; consider schedule buffer',
    portDelay: 'Expect port congestion; consider alternate port or earlier dispatch',
    flightDelay: 'High flight delay risk; consider backup carrier or ground alternative',
    geopolitical: 'Active geopolitical risk on this route; review manually before dispatch',
    historical: 'This route has a history of delays; flag for extra buffer time',
    traffic: 'Heavy traffic detected; consider rerouting or schedule adjustment',
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

async function riskEngine(shipment, options = {}) {
  const { includeTraffic = false, seed = 'default' } = options;
  
  const baseWeights = {
    weather: 0.22,
    portDelay: 0.18,
    flightDelay: 0.18,
    geopolitical: 0.18,
    historical: 0.14,
    traffic: 0.10,
  };
  
  const activeKeys = ['weather', 'geopolitical', 'historical'];
  if (shipment.mode === 'sea') activeKeys.push('portDelay');
  if (shipment.mode === 'air') activeKeys.push('flightDelay');
  if (includeTraffic) activeKeys.push('traffic');
  
  const weights = renormalizeWeights(baseWeights, activeKeys);
  
  const promises = [
    getWeatherRisk(shipment.destination),
    getGeoRisk(shipment.originCountry, shipment.destinationCountry),
    Promise.resolve(getHistoricalRisk(shipment.origin, shipment.destination, shipment.mode)),
  ];
  
  if (shipment.mode === 'sea') {
    promises.push(Promise.resolve(portDelayEngine({
      portName: shipment.portName,
      country: shipment.destinationCountry,
      arrivalDate: shipment.eta
    })));
  } else if (shipment.mode === 'air') {
    promises.push(getFlightRisk(shipment.originAirport, shipment.destinationAirport));
  } else {
    promises.push(Promise.resolve(null));
  }
  
  if (includeTraffic) {
    const { getTrafficForRoute, trafficScoreToRiskFactor } = require('./trafficEngine');
    promises.push(getTrafficForRoute(shipment.origin, shipment.destination, shipment.mode, seed + '-traffic')
      .then(t => trafficScoreToRiskFactor(t.overallScore || t.score))
      .catch(() => null));
  }
  
  const results = await Promise.allSettled(promises);
  
  const weather = results[0].status === 'fulfilled' ? results[0].value : { score: 3, reason: 'Weather service unavailable' };
  const geopolitical = results[1].status === 'fulfilled' ? results[1].value : { score: 3, reason: 'Geo service unavailable' };
  const historical = results[2].status === 'fulfilled' ? results[2].value : { score: 3, reason: 'Historical service unavailable' };
  const modeSignal = results[3].status === 'fulfilled' ? results[3].value : null;
  const traffic = includeTraffic && results[4] ? (results[4].status === 'fulfilled' ? results[4].value : null) : null;
  
  let finalScore = 0;
  finalScore += weather.score * weights.weather;
  finalScore += geopolitical.score * weights.geopolitical;
  finalScore += historical.score * weights.historical;
  
  if (shipment.mode === 'sea' && modeSignal) {
    finalScore += modeSignal.score * weights.portDelay;
  } else if (shipment.mode === 'air' && modeSignal) {
    finalScore += modeSignal.score * weights.flightDelay;
  }
  
  if (includeTraffic && traffic) {
    finalScore += traffic * weights.traffic;
  }
  
  finalScore = Math.round(finalScore);
  finalScore = Math.max(1, Math.min(10, finalScore));
  
  const riskLevel = computeRiskLevel(finalScore);
  
  const breakdown = {
    weather: { score: weather.score, reason: weather.reason },
    geopolitical: { score: geopolitical.score, reason: geopolitical.reason },
    historical: { score: historical.score, reason: historical.reason },
    portDelay: shipment.mode === 'sea' && modeSignal ? { score: modeSignal.score, reason: modeSignal.reason } : null,
    flightDelay: shipment.mode === 'air' && modeSignal ? { score: modeSignal.score, reason: modeSignal.reason } : null,
    traffic: includeTraffic && traffic ? { score: traffic, reason: 'Real-time traffic data' } : null,
  };
  
  const recommendation = generateRecommendation(breakdown);
  
  return {
    shipmentId: shipment.id,
    riskScore: finalScore,
    riskLevel,
    breakdown,
    recommendation,
    computedAt: new Date().toISOString(),
  };
}

function recalculate(shipment) {
  const freshSeed = Date.now().toString();
  return riskEngine(shipment, { includeTraffic: true, seed: freshSeed });
}

module.exports = { riskEngine, recalculate };