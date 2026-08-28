function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function randomInt(seed, min, max) {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

function randomFloat(seed, min, max) {
  return seededRandom(seed) * (max - min) + min;
}

module.exports = { hashString, seededRandom, randomInt, randomFloat };