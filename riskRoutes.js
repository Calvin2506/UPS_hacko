const express = require('express');
const { riskEngine, recalculate } = require('./riskEngine');
const { riskEngineWithTraffic, recalculateWithTraffic } = require('./riskEngineWithTraffic');

const router = express.Router();

function validateShipment(body) {
  const required = ['id', 'origin', 'destination', 'originCountry', 'destinationCountry', 'mode', 'eta', 'route'];
  const missing = required.filter(f => !body[f]);
  if (missing.length) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
  if (!['sea', 'air'].includes(body.mode)) {
    return { valid: false, error: "mode must be 'sea' or 'air'" };
  }
  if (body.mode === 'sea' && !body.portName) {
    return { valid: false, error: 'portName required for sea mode' };
  }
  if (body.mode === 'air' && (!body.originAirport || !body.destinationAirport)) {
    return { valid: false, error: 'originAirport and destinationAirport required for air mode' };
  }
  return { valid: true };
}

router.post('/score', async (req, res) => {
  const validation = validateShipment(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  try {
    const result = await riskEngine(req.body);
    res.json(result);
  } catch (err) {
    console.error('Risk engine error:', err);
    res.status(500).json({ error: 'Internal scoring error', details: err.message });
  }
});

router.post('/recalculate', async (req, res) => {
  const validation = validateShipment(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  try {
    const result = await recalculate(req.body);
    res.json(result);
  } catch (err) {
    console.error('Recalculate error:', err);
    res.status(500).json({ error: 'Internal scoring error', details: err.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/score/traffic', async (req, res) => {
  const validation = validateShipment(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  try {
    const result = await riskEngineWithTraffic(req.body);
    res.json(result);
  } catch (err) {
    console.error('Risk engine with traffic error:', err);
    res.status(500).json({ error: 'Internal scoring error', details: err.message });
  }
});

router.post('/recalculate/traffic', async (req, res) => {
  const validation = validateShipment(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  try {
    const result = await recalculateWithTraffic(req.body);
    res.json(result);
  } catch (err) {
    console.error('Recalculate with traffic error:', err);
    res.status(500).json({ error: 'Internal scoring error', details: err.message });
  }
});

module.exports = router;