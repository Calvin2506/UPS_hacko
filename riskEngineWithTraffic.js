const { riskEngine, recalculate } = require('./riskEngine');
const { 
  getTrafficForRoute, 
  getTrafficForPort, 
  getTrafficForAirport,
  trafficScoreToRiskFactor 
} = require('./trafficEngine');

async function riskEngineWithTraffic(shipment, seed = 'default') {
  const baseResult = await riskEngine(shipment, seed);
  const baseSeed = require('./seedRandom').hashString(`${shipment.id}|${seed}`);
  
  let trafficData = null;
  let trafficRiskFactor = 0;
  
  if (shipment.mode === 'sea') {
    trafficData = await getTrafficForPort(shipment.portName, shipment.destinationCountry, baseSeed + 10);
    trafficRiskFactor = trafficScoreToRiskFactor(trafficData.score);
  } else if (shipment.mode === 'air') {
    const originTraffic = await getTrafficForAirport(shipment.originAirport, baseSeed + 10);
    const destTraffic = await getTrafficForAirport(shipment.destinationAirport, baseSeed + 20);
    const avgScore = Math.round((originTraffic.score + destTraffic.score) / 2);
    trafficRiskFactor = trafficScoreToRiskFactor(avgScore);
    trafficData = { origin: originTraffic, destination: destTraffic, overallScore: avgScore };
  }
  
  const TRAFFIC_WEIGHT = 0.15;
  
  const originalWeights = {
    weather: 0.25,
    portDelay: 0.20,
    flightDelay: 0.20,
    geopolitical: 0.20,
    historicalDelayRate: 0.15
  };
  
  const activeKeys = ['weather', 'geopolitical', 'historicalDelayRate'];
  if (shipment.mode === 'sea') activeKeys.push('portDelay');
  if (shipment.mode === 'air') activeKeys.push('flightDelay');
  
  let totalOriginalWeight = 0;
  for (const key of activeKeys) totalOriginalWeight += originalWeights[key];
  
  const renormalizedWeights = {};
  for (const key of activeKeys) {
    renormalizedWeights[key] = (originalWeights[key] / totalOriginalWeight) * (1 - TRAFFIC_WEIGHT);
  }
  renormalizedWeights.traffic = TRAFFIC_WEIGHT;
  
  let finalScore = 0;
  finalScore += baseResult.breakdown.weather.score * renormalizedWeights.weather;
  finalScore += baseResult.breakdown.geopolitical.score * renormalizedWeights.geopolitical;
  finalScore += baseResult.breakdown.historicalDelayRate.score * renormalizedWeights.historicalDelayRate;
  if (baseResult.breakdown.portDelay) {
    finalScore += baseResult.breakdown.portDelay.score * renormalizedWeights.portDelay;
  }
  if (baseResult.breakdown.flightDelay) {
    finalScore += baseResult.breakdown.flightDelay.score * renormalizedWeights.flightDelay;
  }
  finalScore += trafficRiskFactor * renormalizedWeights.traffic;
  
  finalScore = Math.round(finalScore);
  finalScore = Math.max(1, Math.min(10, finalScore));
  
  const riskLevel = baseResult.riskLevel;
  
  return {
    ...baseResult,
    riskScore: finalScore,
    riskLevel: finalScore <= 3 ? 'low' : finalScore <= 6 ? 'medium' : 'high',
    breakdown: {
      ...baseResult.breakdown,
      traffic: trafficData ? {
        score: trafficRiskFactor,
        reason: `Traffic: ${trafficData.origin?.severity || trafficData.severity} at ${shipment.mode === 'sea' ? 'port' : 'airport'}`
      } : null
    },
    computedAt: new Date().toISOString()
  };
}

function recalculateWithTraffic(shipment) {
  const freshSeed = Date.now().toString();
  return riskEngineWithTraffic(shipment, freshSeed);
}

module.exports = { riskEngineWithTraffic, recalculateWithTraffic };

// Test
if (require.main === module) {
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
  
  riskEngineWithTraffic(sampleShipment).then(r => console.log(JSON.stringify(r, null, 2)));
}