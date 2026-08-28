require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CACHE = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

const HIGH_SEVERITY_KEYWORDS = ['war', 'conflict', 'blockade', 'invasion', 'embargo', 'sanctions', 'border closure', 'trade restriction'];

function getCacheKey(origin, destination) {
  return `geo:${origin.toLowerCase()}-${destination.toLowerCase()}`;
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

function getMockFallback(originCountry, destinationCountry) {
  try {
    const geoPath = path.join(__dirname, '..', 'geoIncidents.json');
    const geoData = JSON.parse(fs.readFileSync(geoPath, 'utf-8'));
    const originRisk = geoData[originCountry]?.baseRisk || 3;
    const destRisk = geoData[destinationCountry]?.baseRisk || 3;
    const score = Math.max(originRisk, destRisk);
    return { score, articleCount: 0, topHeadline: null, reason: `Using static geo risk table for ${originCountry}-${destinationCountry}` };
  } catch {
    return { score: 3, articleCount: 0, topHeadline: null, reason: `Fallback: no geo data for ${originCountry}-${destinationCountry}` };
  }
}

function scoreFromArticles(articles) {
  if (!articles || articles.length === 0) return 1 + Math.floor(Math.random() * 2);
  
  let score = Math.min(5 + articles.length, 9);
  
  for (const article of articles) {
    const title = (article.title || '').toLowerCase();
    for (const kw of HIGH_SEVERITY_KEYWORDS) {
      if (title.includes(kw)) {
        score = Math.min(score + 2, 9);
        break;
      }
    }
  }
  
  return score;
}

async function getGeoRisk(originCountry, destinationCountry) {
  const cached = getCached(originCountry, destinationCountry);
  if (cached) {
    console.log(`[geoNewsService] Cache hit for ${originCountry}-${destinationCountry}`);
    return cached;
  }

  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    console.warn('[geoNewsService] No NEWSAPI_KEY set, using static fallback');
    return getMockFallback(originCountry, destinationCountry);
  }

  try {
    const query = `"${destinationCountry}" AND (strike OR "border closure" OR sanctions OR "trade restriction" OR unrest OR conflict)`;
    const url = `https://newsapi.org/v2/everything`;
    const res = await axios.get(url, {
      params: {
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 5,
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        apiKey,
      },
      timeout: 8000,
    });

    const articles = res.data.articles || [];
    const score = scoreFromArticles(articles);
    const topHeadline = articles[0]?.title || null;
    
    const reason = articles.length === 0
      ? `No recent risk articles for ${destinationCountry}`
      : `${articles.length} relevant article(s) found for ${destinationCountry}`;

    const result = { score, articleCount: articles.length, topHeadline, reason };
    setCache(originCountry, destinationCountry, result);
    console.log(`[geoNewsService] Live data for ${originCountry}-${destinationCountry}: score=${result.score}, articles=${articles.length}`);
    return result;
  } catch (err) {
    console.warn(`[geoNewsService] API failed for ${originCountry}-${destinationCountry}: ${err.message}, using static fallback`);
    return getMockFallback(originCountry, destinationCountry);
  }
}

module.exports = { getGeoRisk };