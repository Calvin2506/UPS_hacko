require('dotenv').config();
const axios = require('axios');

const CACHE = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

const WEATHER_RISK_MAP = {
  'Thunderstorm': { base: 8, range: 2 },
  'Drizzle': { base: 4, range: 2 },
  'Rain': { base: 5, range: 3 },
  'Snow': { base: 7, range: 2 },
  'Mist': { base: 4, range: 1 },
  'Smoke': { base: 5, range: 1 },
  'Haze': { base: 3, range: 1 },
  'Dust': { base: 4, range: 1 },
  'Fog': { base: 5, range: 2 },
  'Sand': { base: 6, range: 2 },
  'Ash': { base: 7, range: 2 },
  'Squall': { base: 6, range: 2 },
  'Tornado': { base: 9, range: 1 },
  'Clear': { base: 1, range: 2 },
  'Clouds': { base: 2, range: 2 },
};

function getCacheKey(cityName) {
  return `weather:${cityName.toLowerCase()}`;
}

function getCached(cityName) {
  const key = getCacheKey(cityName);
  const entry = CACHE.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCache(cityName, data) {
  CACHE.set(getCacheKey(cityName), { data, timestamp: Date.now() });
}

function mapWeatherToRisk(weatherData) {
  const main = weatherData.weather?.[0]?.main || 'Clear';
  const windSpeed = weatherData.wind?.speed || 0;
  const visibility = weatherData.visibility || 10000;

  const mapping = WEATHER_RISK_MAP[main] || { base: 3, range: 2 };
  let score = mapping.base + Math.floor(Math.random() * (mapping.range + 1));

  if (windSpeed > 15) score += windSpeed > 25 ? 2 : 1;
  if (visibility < 1000) score += visibility < 500 ? 2 : 1;

  score = Math.max(1, Math.min(10, score));

  const condition = weatherData.weather?.[0]?.description || main;
  const reason = `${condition} at destination${windSpeed > 15 ? ' with high winds' : ''}${visibility < 1000 ? ', low visibility' : ''}`;

  return { score, condition: main, reason };
}

function getMockFallback(cityName) {
  const hash = cityName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const score = (hash % 10) + 1;
  return { score, condition: 'Unknown (fallback)', reason: `Using mocked weather risk for ${cityName}` };
}

async function getWeatherRisk(cityName) {
  const cached = getCached(cityName);
  if (cached) {
    console.log(`[weatherService] Cache hit for ${cityName}`);
    return cached;
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.warn('[weatherService] No OPENWEATHER_API_KEY set, using fallback');
    return getMockFallback(cityName);
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather`;
    const res = await axios.get(url, {
      params: { q: cityName, appid: apiKey },
      timeout: 5000,
    });
    const result = mapWeatherToRisk(res.data);
    setCache(cityName, result);
    console.log(`[weatherService] Live data for ${cityName}: score=${result.score}`);
    return result;
  } catch (err) {
    console.warn(`[weatherService] API failed for ${cityName}: ${err.message}, using fallback`);
    return getMockFallback(cityName);
  }
}

module.exports = { getWeatherRisk };