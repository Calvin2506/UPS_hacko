const express = require('express');
const { 
  getTrafficForRoute, 
  getTrafficForPort, 
  getTrafficForAirport,
  trafficScoreToRiskFactor 
} = require('../trafficEngine');

const router = express.Router();

router.get('/route', async (req, res) => {
  const { origin, destination, mode, seed } = req.query;
  if (!origin || !destination || !mode) {
    return res.status(400).json({ error: 'origin, destination, and mode are required' });
  }
  try {
    const traffic = await getTrafficForRoute(origin, destination, mode, seed);
    res.json(traffic);
  } catch (err) {
    console.error('Traffic route error:', err);
    res.status(500).json({ error: 'Failed to fetch route traffic' });
  }
});

router.get('/port', async (req, res) => {
  const { portName, country, seed } = req.query;
  if (!portName || !country) {
    return res.status(400).json({ error: 'portName and country are required' });
  }
  try {
    const traffic = await getTrafficForPort(portName, country, seed);
    res.json(traffic);
  } catch (err) {
    console.error('Traffic port error:', err);
    res.status(500).json({ error: 'Failed to fetch port traffic' });
  }
});

router.get('/airport', async (req, res) => {
  const { airportCode, seed } = req.query;
  if (!airportCode) {
    return res.status(400).json({ error: 'airportCode is required' });
  }
  try {
    const traffic = await getTrafficForAirport(airportCode, seed);
    res.json(traffic);
  } catch (err) {
    console.error('Traffic airport error:', err);
    res.status(500).json({ error: 'Failed to fetch airport traffic' });
  }
});

router.get('/risk-factor', async (req, res) => {
  const { origin, destination, mode, seed } = req.query;
  if (!origin || !destination || !mode) {
    return res.status(400).json({ error: 'origin, destination, and mode are required' });
  }
  try {
    const traffic = await getTrafficForRoute(origin, destination, mode, seed);
    const riskFactor = trafficScoreToRiskFactor(traffic.overallScore || traffic.score);
    res.json({ traffic, riskFactor });
  } catch (err) {
    console.error('Traffic risk factor error:', err);
    res.status(500).json({ error: 'Failed to compute traffic risk factor' });
  }
});

module.exports = router;