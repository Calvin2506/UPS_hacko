require('dotenv').config();
const axios = require('axios');

const CACHE = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCacheKey(origin, destination) {
  return `flight:${origin.toUpperCase()}-${destination.toUpperCase()}`;
}

function getCached(origin, destination) {
  const key = getCacheKey(origin, destination);
  const entry = CACHE.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCache(origin, destination, data) {
  CACHE.set(getCacheKey(origin, destination), { data, timestamp: Date.now() });
}

function delayToScore(delayMinutes) {
  if (delayMinutes <= 15) return 1 + Math.floor(Math.random() * 3);
  if (delayMinutes <= 60) return 4 + Math.floor(Math.random() * 3);
  return 7 + Math.floor(Math.random() * 4);
}

function getMockFallback(origin, destination) {
  const hash = (origin + destination).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const score = (hash % 10) + 1;
  return { score, delayMinutes: null, reason: `No live flight data for ${origin}-${destination} — using baseline estimate` };
}

async function getFlightRisk(originAirportCode, destinationAirportCode) {
  const cached = getCached(originAirportCode, destinationAirportCode);
  if (cached) {
    console.log(`[flightService] Cache hit for ${originAirportCode}-${destinationAirportCode}`);
    return cached;
  }

  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey) {
    console.warn('[flightService] No AVIATIONSTACK_API_KEY set, using fallback');
    return getMockFallback(originAirportCode, destinationAirportCode);
  }

  try {
    const url = `http://api.aviationstack.com/v1/flights`;
    const res = await axios.get(url, {
      params: {
        access_key: apiKey,
        dep_iata: originAirportCode,
        arr_iata: destinationAirportCode,
        limit: 10,
      },
      timeout: 5000,
    });

    const flights = res.data.data || [];
    if (flights.length === 0) {
      console.warn(`[flightService] No flights found for ${originAirportCode}-${destinationAirportCode}, using fallback`);
      return getMockFallback(originAirportCode, destinationAirportCode);
    }

    let maxDelay = 0;
    let worstStatus = 'on_time';
    for (const flight of flights) {
      const depDelay = flight.departure?.delay || 0;
      const arrDelay = flight.arrival?.delay || 0;
      const delay = Math.max(depDelay, arrDelay);
      if (delay > maxDelay) maxDelay = delay;
      if (flight.flight_status === 'cancelled') worstStatus = 'cancelled';
      else if (flight.flight_status === 'delayed' && worstStatus !== 'cancelled') worstStatus = 'delayed';
    }

    let score;
    if (worstStatus === 'cancelled') score = 10;
    else score = delayToScore(maxDelay);

    score = Math.max(1, Math.min(10, score));
    const reason = worstStatus === 'cancelled' 
      ? `Flights on ${originAirportCode}-${destinationAirportCode} cancelled`
      : `Max observed delay: ${maxDelay}min on ${originAirportCode}-${destinationAirportCode}`;

    const result = { score, delayMinutes: maxDelay, reason };
    setCache(originAirportCode, destinationAirportCode, result);
    console.log(`[flightService] Live data for ${originAirportCode}-${destinationAirportCode}: score=${result.score}`);
    return result;
  } catch (err) {
    console.warn(`[flightService] API failed for ${originAirportCode}-${destinationAirportCode}: ${err.message}, using fallback`);
    return getMockFallback(originAirportCode, destinationAirportCode);
  }
}

module.exports = { getFlightRisk };