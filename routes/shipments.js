const express = require('express');
const fs = require('fs');
const path = require('path');
const { riskEngine, recalculate } = require('../riskEngine');
const { enrichShipmentWithSLA } = require('../slaEngine');
const ROLE_PERMISSIONS = require('../config/rolePermissions');
const { stripFields } = require('../utils/responseFilters');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'db.json');
const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const writeDb = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

const detail = async (shipment, refresh = false) => {
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

function getPermissions(req) {
  return ROLE_PERMISSIONS[req.userRole] || ROLE_PERMISSIONS.dispatcher;
}

router.get('/shipments', (req, res) => {
  const perms = getPermissions(req);
  let shipments = readDb().shipments || [];
  
  if (!perms.canViewAllModes) {
    shipments = shipments.filter(s => s.mode === 'ground');
  }
  
  const response = shipments.map(({ id, origin, destination, mode, eta, riskScore, riskLevel }) => ({
    id, origin, destination, mode, eta, riskScore, riskLevel
  }));
  
  if (!perms.canViewCost) {
    res.json(response.map(s => stripFields(s, ['cost', 'exposure', 'savings'])));
  } else {
    res.json(response);
  }
});

router.get('/shipments/:id', async (req, res, next) => {
  try {
    const perms = getPermissions(req);
    const shipment = (readDb().shipments || []).find(({ id }) => id === req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    
    if (!perms.canViewAllModes && shipment.mode !== 'ground') {
      return res.status(403).json({ error: 'Access restricted for your role' });
    }
    
    let result = await detail(shipment);
    
    if (!perms.canViewBreakdown) {
      result = stripFields(result, ['breakdown']);
    }
    if (!perms.canViewCost) {
      result = stripFields(result, ['sla.cost', 'sla.savingsIfActioned']);
    }
    
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/shipments/:id/recalculate', async (req, res, next) => {
  try {
    if (req.userRole !== 'dispatcher') {
      return res.status(403).json({ error: 'Recalculate requires Dispatcher role' });
    }
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
    if (req.userRole !== 'dispatcher') {
      return res.status(403).json({ error: 'Action requires Dispatcher role' });
    }
    const db = readDb();
    const index = (db.shipments || []).findIndex(({ id }) => id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Shipment not found' });
    db.shipments[index] = { ...db.shipments[index], actioned: true };
    writeDb(db);
    res.json(await detail(db.shipments[index]));
  } catch (error) { next(error); }
});

module.exports = router;