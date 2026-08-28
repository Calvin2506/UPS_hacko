const { hashString, randomFloat, randomInt } = require('./seedRandom');

const TRAFFIC_PROVIDERS = {
  mock: 'mock',
  mapbox: 'mapbox',
  google: 'google',
  openstreetmap: 'openstreetmap'
};

const DEFAULT_PROVIDER = process.env.TRAFFIC_PROVIDER || TRAFFIC_PROVIDERS.mock;

const MOCK_TRAFFIC_PATTERNS = {
  'port': ['low', 'moderate', 'heavy', 'congested'],
  'airport': ['clear', 'moderate', 'delayed', 'ground_stop'],
  'highway': ['free_flow', 'moderate', 'heavy', 'gridlock'],
  'border': ['open', 'inspection_delay', 'congested', 'closed']
};

function getMockTrafficForLocation(location, type, seed) {
  const patterns = MOCK_TRAFFIC_PATTERNS[type] || MOCK_TRAFFIC_PATTERNS.highway;
  const baseSeed = hashString(`${location}|${type}|${seed}`);
  const idx = randomInt(baseSeed, 0, patterns.length - 1);
  const severity = patterns[idx];
  
  const severityScores = {
    'low': 1, 'clear': 1, 'free_flow': 1, 'open': 1,
    'moderate': 3, 'inspection_delay': 4,
    'heavy': 6, 'delayed': 6, 'congested': 7,
    'gridlock': 9, 'ground_stop': 9, 'closed': 10
  };
  
  return {
    location,
    type,
    severity,
    score: severityScores[severity] || 5,
    timestamp: new Date().toISOString(),
    provider: 'mock',
    metadata: {
      averageSpeedKph: Math.round(randomFloat(baseSeed + 1, 5, 80)),
      incidentCount: randomInt(baseSeed + 2, 0, 5),
      estimatedDelayMinutes: randomInt(baseSeed + 3, 0, 120)
    }
  };
}

async function fetchMapboxTraffic(query) {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error('MAPBOX_ACCESS_TOKEN not set');
  
  try {
    const axios = require('axios');
    const url = `https://api.mapbox.com/traffic/v1/incidents?${new URLSearchParams(query)}&access_token=${token}`;
    const res = await axios.get(url, { timeout: 8000 });
    return res.data;
  } catch (err) {
    throw new Error(`Mapbox traffic fetch failed: ${err.message}`);
  }
}

async function fetchGoogleTraffic(origin, destination) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('GOOGLE_MAPS_API_KEY not set');
  
  try {
    const axios = require('axios');
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&departure_time=now&traffic_model=best_guess&key=${key}`;
    const res = await axios.get(url, { timeout: 8000 });
    return res.data;
  } catch (err) {
    throw new Error(`Google Maps traffic fetch failed: ${err.message}`);
  }
}

async function fetchOpenStreetMapTraffic(bbox) {
  try {
    const axios = require('axios');
    const url = `https://overpass-api.de/api/interpreter?data=[out:json];way[highway][traffic_signals](${bbox});out;`;
    const res = await axios.get(url, { timeout: 10000 });
    return res.data;
  } catch (err) {
    throw new Error(`OpenStreetMap traffic fetch failed: ${err.message}`);
  }
}

async function getTrafficForRoute(origin, destination, mode, seed = 'default') {
  const baseSeed = hashString(`${origin}|${destination}|${mode}|${seed}`);
  
  if (DEFAULT_PROVIDER === TRAFFIC_PROVIDERS.mock) {
    const type = mode === 'sea' ? 'port' : mode === 'air' ? 'airport' : 'highway';
    const originTraffic = getMockTrafficForLocation(origin, type, baseSeed);
    const destTraffic = getMockTrafficForLocation(destination, type, baseSeed + 100);
    const routeTraffic = getMockTrafficForLocation(`${origin}-${destination}`, 'highway', baseSeed + 200);
    
    return {
      origin: originTraffic,
      destination: destTraffic,
      route: routeTraffic,
      overallScore: Math.round((originTraffic.score + destTraffic.score + routeTraffic.score) / 3),
      provider: 'mock',
      fetchedAt: new Date().toISOString()
    };
  }
  
  if (DEFAULT_PROVIDER === TRAFFIC_PROVIDERS.mapbox) {
    try {
      const data = await fetchMapboxTraffic({ 
        bbox: `${origin},${destination}`,
        types: 'congestion,incident,construction'
      });
      return { ...data, provider: 'mapbox', fetchedAt: new Date().toISOString() };
    } catch (err) {
      console.warn('Mapbox failed, falling back to mock:', err.message);
      return getTrafficForRoute(origin, destination, mode, seed);
    }
  }
  
  if (DEFAULT_PROVIDER === TRAFFIC_PROVIDERS.google) {
    try {
      const data = await fetchGoogleTraffic(origin, destination);
      return { ...data, provider: 'google', fetchedAt: new Date().toISOString() };
    } catch (err) {
      console.warn('Google Maps failed, falling back to mock:', err.message);
      return getTrafficForRoute(origin, destination, mode, seed);
    }
  }
  
  if (DEFAULT_PROVIDER === TRAFFIC_PROVIDERS.openstreetmap) {
    try {
      const data = await fetchOpenStreetMapTraffic(`${origin},${destination}`);
      return { ...data, provider: 'openstreetmap', fetchedAt: new Date().toISOString() };
    } catch (err) {
      console.warn('OpenStreetMap failed, falling back to mock:', err.message);
      return getTrafficForRoute(origin, destination, mode, seed);
    }
  }
  
  return getTrafficForRoute(origin, destination, mode, seed);
}

async function getTrafficForPort(portName, country, seed = 'default') {
  const baseSeed = hashString(`${portName}|${country}|port|${seed}`);
  
  if (DEFAULT_PROVIDER === TRAFFIC_PROVIDERS.mock) {
    return getMockTrafficForLocation(portName, 'port', baseSeed);
  }
  
  return getTrafficForRoute(portName, country, 'sea', seed);
}

async function getTrafficForAirport(airportCode, seed = 'default') {
  const baseSeed = hashString(`${airportCode}|airport|${seed}`);
  
  if (DEFAULT_PROVIDER === TRAFFIC_PROVIDERS.mock) {
    return getMockTrafficForLocation(airportCode, 'airport', baseSeed);
  }
  
  return getTrafficForRoute(airportCode, airportCode, 'air', seed);
}

function trafficScoreToRiskFactor(trafficScore) {
  return Math.min(10, Math.max(1, Math.round(trafficScore * 1.2)));
}

module.exports = {
  TRAFFIC_PROVIDERS,
  getTrafficForRoute,
  getTrafficForPort,
  getTrafficForAirport,
  trafficScoreToRiskFactor,
  getMockTrafficForLocation
};