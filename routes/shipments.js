const express = require('express');
const fs = require('fs');
const path = require('path');
const { riskEngine, recalculate } = require('../riskEngine');
const { enrichShipmentWithSLA } = require('../slaEngine');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'db.json');
const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const writeDb = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
const detail = async (shipment, refresh = false) => {
  // The lightweight seed data intentionally omits scoring-only route metadata.
  // Supply deterministic fallbacks before passing it to the existing engines.
  const scoringShipment = {
    ...shipment,
    route: shipment.route || `${shipment.origin}-${shipment.destination}`,
    portName: shipment.portName || shipment.destination,
    originAirport: shipment.originAirport || shipment.origin.slice(0, 3).toUpperCase(),
    destinationAirport: shipment.destinationAirport || shipment.destination.slice(0, 3).toUpperCase(),
  };
  const risk = refresh ? await recalculate(scoringShipment) : await riskEngine(scoringShipment);
  return enrichShipmentWithSLA({ ...shipment, ...risk, id: shipment.id });
};

router.get('/shipments', (req, res) => {
  const shipments = readDb().shipments || [];
  res.json(shipments.map(({ id, origin, destination, mode, eta, riskScore, riskLevel }) => ({ id, origin, destination, mode, eta, riskScore, riskLevel })));
});

router.get('/shipments/:id', async (req, res, next) => {
  try {
    const shipment = (readDb().shipments || []).find(({ id }) => id === req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.json(await detail(shipment));
  } catch (error) { next(error); }
});

router.post('/shipments/:id/recalculate', async (req, res, next) => {
  try {
    const db = readDb();
    const index = (db.shipments || []).findIndex(({ id }) => id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Shipment not found' });
    const updated = await detail(db.shipments[index], true);
    db.shipments[index] = { ...db.shipments[index], riskScore: updated.riskScore, riskLevel: updated.riskLevel };
    writeDb(db);
    res.json(updated);
  } catch (error) { next(error); }
});

router.post('/shipments/:id/action', async (req, res, next) => {
  try {
    const db = readDb();
    const index = (db.shipments || []).findIndex(({ id }) => id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Shipment not found' });
    db.shipments[index] = { ...db.shipments[index], actioned: true };
    writeDb(db);
    res.json(await detail(db.shipments[index]));
  } catch (error) { next(error); }
});

module.exports = router;
