const { hashString, randomInt } = require('./seedRandom');

const WEIGHTS = {
  congestion: 0.35,
  customsDelay: 0.25,
  laborRisk: 0.15,
  weatherImpact: 0.15,
  equipmentAvailability: 0.10
};

const REQUIRED_FIELDS = ['portName', 'country', 'arrivalDate'];

function validateInput(input) {
  const missing = REQUIRED_FIELDS.filter(f => !input?.[f]);
  if (missing.length) {
    throw new Error(`portDelayEngine: missing required fields: ${missing.join(', ')}`);
  }
}

function generateFactors(portName, seed) {
  const baseSeed = hashString(portName + '|' + seed);
  return {
    congestion: randomInt(baseSeed + 1, 1, 10),
    customsDelay: randomInt(baseSeed + 2, 1, 10),
    laborRisk: randomInt(baseSeed + 3, 1, 10),
    weatherImpact: randomInt(baseSeed + 4, 1, 10),
    equipmentAvailability: randomInt(baseSeed + 5, 1, 10)
  };
}

function computeScore(factors) {
  let score = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    score += factors[key] * weight;
  }
  return Math.round(score);
}

function generateReason(portName, factors) {
  const sorted = Object.entries(factors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  
  const topFactors = sorted.map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase().trim());
  return `High ${topFactors.join(' and ')} at ${portName}`;
}

function portDelayEngine(input, seed = 'default') {
  validateInput(input);
  const factors = generateFactors(input.portName, seed);
  const score = computeScore(factors);
  const reason = generateReason(input.portName, factors);
  
  return {
    score: Math.max(1, Math.min(10, score)),
    factors,
    reason
  };
}

module.exports = { portDelayEngine, validateInput: portDelayEngine.validateInput = validateInput };