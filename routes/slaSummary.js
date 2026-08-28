const { getFleetSummary, enrichShipmentWithSLA } = require('../slaEngine');
const ROLE_PERMISSIONS = require('../config/rolePermissions');
const { stripFields } = require('../utils/responseFilters');

async function getShipmentsFromDB() {
  try {
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, '..', 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    return db.shipments || [];
  } catch {
    return [];
  }
}

async function slaSummaryHandler(req, res) {
  try {
    const perms = ROLE_PERMISSIONS[req.userRole] || ROLE_PERMISSIONS.dispatcher;
    const shipments = await getShipmentsFromDB();
    const summary = getFleetSummary(shipments);
    
    if (!perms.canViewCost) {
      return res.json(stripFields(summary, ['totalExposure', 'totalPotentialSavings', 'avgBreachProbability']));
    }
    
    res.json(summary);
  } catch (err) {
    console.error('SLA summary error:', err);
    res.status(500).json({ error: 'Failed to compute SLA summary' });
  }
}

module.exports = { slaSummaryHandler };