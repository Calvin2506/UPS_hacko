const express = require('express');
const cors = require('cors');
const riskRoutes = require('./riskRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/risk', riskRoutes);

app.get('/', (req, res) => {
  res.json({ 
    service: 'UPS Risk Scoring Engine', 
    version: '1.0.0',
    endpoints: {
      score: 'POST /api/risk/score',
      recalculate: 'POST /api/risk/recalculate',
      health: 'GET /api/risk/health'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Risk engine API running on http://localhost:${PORT}`);
  });
}

module.exports = app;