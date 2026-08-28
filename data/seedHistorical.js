const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db.json');

const HISTORICAL_ROUTES = [
  { origin: 'Shanghai', destination: 'Los Angeles', mode: 'sea', totalShipments: 247, delayedShipments: 62, avgDelayHours: 36 },
  { origin: 'Shanghai', destination: 'Los Angeles', mode: 'air', totalShipments: 189, delayedShipments: 28, avgDelayHours: 8 },
  { origin: 'London', destination: 'New York', mode: 'air', totalShipments: 312, delayedShipments: 47, avgDelayHours: 6 },
  { origin: 'London', destination: 'New York', mode: 'sea', totalShipments: 156, delayedShipments: 31, avgDelayHours: 48 },
  { origin: 'Mumbai', destination: 'Dubai', mode: 'ground', totalShipments: 89, delayedShipments: 12, avgDelayHours: 4 },
  { origin: 'Mumbai', destination: 'Dubai', mode: 'air', totalShipments: 203, delayedShipments: 15, avgDelayHours: 3 },
  { origin: 'Singapore', destination: 'Rotterdam', mode: 'sea', totalShipments: 178, delayedShipments: 44, avgDelayHours: 42 },
  { origin: 'Singapore', destination: 'Los Angeles', mode: 'sea', totalShipments: 134, delayedShipments: 19, avgDelayHours: 24 },
  { origin: 'Hong Kong', destination: 'Los Angeles', mode: 'air', totalShipments: 267, delayedShipments: 38, avgDelayHours: 5 },
  { origin: 'Frankfurt', destination: 'Chicago', mode: 'air', totalShipments: 145, delayedShipments: 22, avgDelayHours: 7 },
  { origin: 'Dubai', destination: 'Shanghai', mode: 'sea', totalShipments: 98, delayedShipments: 34, avgDelayHours: 54 },
  { origin: 'Los Angeles', destination: 'Tokyo', mode: 'air', totalShipments: 167, delayedShipments: 18, avgDelayHours: 4 },
  { origin: 'Rotterdam', destination: 'New York', mode: 'sea', totalShipments: 123, delayedShipments: 28, avgDelayHours: 30 },
  { origin: 'Chennai', destination: 'Singapore', mode: 'sea', totalShipments: 76, delayedShipments: 21, avgDelayHours: 18 },
  { origin: 'Sydney', destination: 'Los Angeles', mode: 'air', totalShipments: 92, delayedShipments: 11, avgDelayHours: 6 },
  { origin: 'Toronto', destination: 'London', mode: 'air', totalShipments: 134, delayedShipments: 16, avgDelayHours: 5 },
  { origin: 'Busan', destination: 'Los Angeles', mode: 'sea', totalShipments: 112, delayedShipments: 25, avgDelayHours: 28 },
  { origin: 'Hamburg', destination: 'Shanghai', mode: 'sea', totalShipments: 87, delayedShipments: 19, avgDelayHours: 36 },
  { origin: 'Dallas', destination: 'Frankfurt', mode: 'air', totalShipments: 156, delayedShipments: 23, avgDelayHours: 7 },
  { origin: 'Vancouver', destination: 'Tokyo', mode: 'sea', totalShipments: 67, delayedShipments: 8, avgDelayHours: 12 },
];

function seed() {
  try {
    let db = {};
    if (fs.existsSync(DB_PATH)) {
      db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
    
    db.historicalRoutes = HISTORICAL_ROUTES;
    
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log(`Seeded ${HISTORICAL_ROUTES.length} historical routes to ${DB_PATH}`);
  } catch (err) {
    console.error('Failed to seed historical data:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed, HISTORICAL_ROUTES };