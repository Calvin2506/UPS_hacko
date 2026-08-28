const PENALTY_RATES = {
  air: 150,
  ground: 60,
  sea: 400
};

const BASE_BUFFER_HOURS = {
  air: 2,
  ground: 4,
  sea: 12
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calculateBreachProbability(riskScore) {
  const score = clamp(riskScore, 1, 10);
  let prob;
  if (score <= 3) {
    prob = 5 + ((score - 1) / 2) * 15;
  } else if (score <= 6) {
    prob = 25 + ((score - 4) / 2) * 30;
  } else {
    prob = 60 + ((score - 7) / 3) * 35;
  }
  return Math.round(clamp(prob, 5, 95));
}

function suggestBuffer(riskScore, mode, originalEtaHoursFromNow) {
  const baseHours = BASE_BUFFER_HOURS[mode] ?? BASE_BUFFER_HOURS.ground;
  const scale = clamp(riskScore, 1, 10) / 10;
  let bufferHours = baseHours * scale;
  const maxBuffer = originalEtaHoursFromNow * 0.5;
  bufferHours = clamp(bufferHours, 0, maxBuffer);
  const adjustedEta = new Date(Date.now() + (originalEtaHoursFromNow + bufferHours) * 3600 * 1000).toISOString();
  return { bufferHours: Math.round(bufferHours * 10) / 10, adjustedEta };
}

function estimateCostExposure(riskScore, mode, breachProbability) {
  const penaltyRate = PENALTY_RATES[mode] ?? PENALTY_RATES.ground;
  const expectedCost = penaltyRate * (breachProbability / 100);
  return { penaltyRate, expectedCost: Math.round(expectedCost * 100) / 100 };
}

function estimateSavingsIfActioned(expectedCost, riskScore) {
  const breachProb = calculateBreachProbability(riskScore);
  const reducedProb = breachProb * 0.4;
  const mode = 'ground';
  const penaltyRate = PENALTY_RATES[mode];
  const newExpectedCost = penaltyRate * (reducedProb / 100);
  const estimatedSavings = expectedCost - newExpectedCost;
  return { 
    newExpectedCost: Math.round(newExpectedCost * 100) / 100, 
    estimatedSavings: Math.round(estimatedSavings * 100) / 100 
  };
}

function getFleetSummary(shipments) {
  const enriched = shipments.map(s => enrichShipmentWithSLA(s));
  let totalExposure = 0;
  let totalPotentialSavings = 0;
  let totalBreachProb = 0;
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;
  
  for (const s of enriched) {
    totalExposure += s.sla.cost.expectedCost;
    totalBreachProb += s.sla.breachProbability;
    if (s.riskLevel === 'high') {
      highRiskCount++;
      totalPotentialSavings += s.sla.savingsIfActioned.estimatedSavings;
    } else if (s.riskLevel === 'medium') {
      mediumRiskCount++;
    } else {
      lowRiskCount++;
    }
  }
  
  return {
    totalShipments: shipments.length,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    totalExposure: Math.round(totalExposure * 100) / 100,
    totalPotentialSavings: Math.round(totalPotentialSavings * 100) / 100,
    avgBreachProbability: Math.round(totalBreachProb / shipments.length)
  };
}

function enrichShipmentWithSLA(shipment) {
  const riskScore = shipment.riskScore ?? 5;
  const mode = shipment.mode ?? 'ground';
  const etaDate = new Date(shipment.eta);
  const originalEtaHoursFromNow = (etaDate.getTime() - Date.now()) / (3600 * 1000);
  
  const breachProbability = calculateBreachProbability(riskScore);
  const buffer = suggestBuffer(riskScore, mode, Math.max(originalEtaHoursFromNow, 1));
  const cost = estimateCostExposure(riskScore, mode, breachProbability);
  const savingsIfActioned = estimateSavingsIfActioned(cost.expectedCost, riskScore);
  
  return {
    ...shipment,
    sla: {
      breachProbability,
      buffer,
      cost,
      savingsIfActioned
    }
  };
}

module.exports = {
  calculateBreachProbability,
  suggestBuffer,
  estimateCostExposure,
  estimateSavingsIfActioned,
  getFleetSummary,
  enrichShipmentWithSLA
};

const sampleShipment = {
  id: 'SHP-2026-001',
  origin: 'Shanghai',
  destination: 'Los Angeles',
  originCountry: 'China',
  destinationCountry: 'USA',
  mode: 'air',
  eta: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
  riskScore: 8,
  riskLevel: 'high',
  breakdown: {}
};

const enriched = enrichShipmentWithSLA(sampleShipment);
console.log('=== Enriched Shipment ===');
console.log(JSON.stringify(enriched, null, 2));

const fleet = [
  { id: 'S1', riskScore: 2, riskLevel: 'low', mode: 'sea', eta: new Date(Date.now() + 10 * 3600 * 1000).toISOString() },
  { id: 'S2', riskScore: 5, riskLevel: 'medium', mode: 'air', eta: new Date(Date.now() + 5 * 3600 * 1000).toISOString() },
  { id: 'S3', riskScore: 8, riskLevel: 'high', mode: 'ground', eta: new Date(Date.now() + 2 * 3600 * 1000).toISOString() },
  { id: 'S4', riskScore: 9, riskLevel: 'high', mode: 'air', eta: new Date(Date.now() + 4 * 3600 * 1000).toISOString() },
  { id: 'S5', riskScore: 3, riskLevel: 'low', mode: 'ground', eta: new Date(Date.now() + 6 * 3600 * 1000).toISOString() }
];

const summary = getFleetSummary(fleet);
console.log('\n=== Fleet Summary ===');
console.log(JSON.stringify(summary, null, 2));