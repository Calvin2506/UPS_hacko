const { hashString, randomInt } = require('./seedRandom');

const WEIGHTS = {
  airportCongestion: 0.25,
  weatherImpact: 0.25,
  airTrafficControl: 0.15,
  crewAvailability: 0.15,
  cargoCapacity: 0.10,
  maintenanceRisk: 0.10
};

function generateFactors(routeKey, seed) {
  const baseSeed = hashString(routeKey + '|' + seed);
  return {
    airportCongestion: randomInt(baseSeed + 1, 1, 10),
    weatherImpact: randomInt(baseSeed + 2, 1, 10),
    airTrafficControl: randomInt(baseSeed + 3, 1, 10),
    crewAvailability: randomInt(baseSeed + 4, 1, 10),
    cargoCapacity: randomInt(baseSeed + 5, 1, 10),
    maintenanceRisk: randomInt(baseSeed + 6, 1, 10)
  };
}

function computeScore(factors) {
  let score = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    score += factors[key] * weight;
  }
  return Math.round(score);
}

function generateReason(routeKey, factors) {
  const sorted = Object.entries(factors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  
  const topFactors = sorted.map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase().trim());
  return `Elevated ${topFactors.join(' and ')} on route ${routeKey}`;
}

function flightDelayEngine({ originAirport, destinationAirport, departureDate }, seed = 'default') {
  const routeKey = `${originAirport}-${destinationAirport}`;
  const factors = generateFactors(routeKey, seed);
  const score = computeScore(factors);
  const reason = generateReason(routeKey, factors);
  
  return {
    score: Math.max(1, Math.min(10, score)),
    factors,
    reason
  };
}

module.exports = { flightDelayEngine };