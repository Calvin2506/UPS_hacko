const fs = require('fs');
const path = require('path');
const { hashString, randomInt, randomFloat } = require('./seedRandom');

const geoIncidents = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'geoIncidents.json'), 'utf-8')
);

async function fetchLiveNewsSignal(query) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return null;
  
  try {
    const axios = require('axios');
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;
    const response = await axios.get(url, { timeout: 5000 });
    const articles = response.data.articles || [];
    return articles.length > 0 ? articles[0].title : null;
  } catch (error) {
    return null;
  }
}

function pickIncident(country, seed) {
  const data = geoIncidents[country];
  if (!data) return { activeIncident: false, incidentType: null, severity: 0 };
  
  const roll = randomFloat(seed, 0, 1);
  if (roll > 0.6) return { activeIncident: false, incidentType: null, severity: 0 };
  
  const incidentIdx = randomInt(seed + 1, 0, data.incidents.length - 1);
  const incident = data.incidents[incidentIdx];
  return {
    activeIncident: true,
    incidentType: incident.type,
    severity: incident.severity
  };
}

function generateReason(originCountry, destinationCountry, originIncident, destIncident) {
  const parts = [];
  if (originIncident.activeIncident) {
    parts.push(`${originIncident.incidentType} reported in ${originCountry}`);
  }
  if (destIncident.activeIncident) {
    parts.push(`${destIncident.incidentType} reported in ${destinationCountry}`);
  }
  if (parts.length === 0) {
    return `No active geopolitical incidents on ${originCountry}-${destinationCountry} route`;
  }
  return parts.join('; ');
}

async function geoRiskEngine({ originCountry, destinationCountry, route }, seed = 'default') {
  const baseSeed = hashString(`${originCountry}|${destinationCountry}|${seed}`);
  
  const originIncident = pickIncident(originCountry, baseSeed);
  const destIncident = pickIncident(destinationCountry, baseSeed + 100);
  
  let score = Math.max(
    geoIncidents[originCountry]?.baseRisk || 3,
    geoIncidents[destinationCountry]?.baseRisk || 3
  );
  
  if (originIncident.activeIncident) score = Math.max(score, originIncident.severity);
  if (destIncident.activeIncident) score = Math.max(score, destIncident.severity);
  
  const query = `${originCountry} OR ${destinationCountry} port strike OR border closure OR trade restriction`;
  const newsResult = await fetchLiveNewsSignal(query);
  if (newsResult) {
    score = Math.min(10, score + 1);
  }
  
  const activeIncident = originIncident.activeIncident || destIncident.activeIncident;
  const incidentType = originIncident.activeIncident ? originIncident.incidentType :
                       destIncident.activeIncident ? destIncident.incidentType : null;
  
  const reason = generateReason(originCountry, destinationCountry, originIncident, destIncident);
  
  return {
    score: Math.max(1, Math.min(10, score)),
    activeIncident,
    incidentType,
    reason
  };
}

module.exports = { geoRiskEngine };