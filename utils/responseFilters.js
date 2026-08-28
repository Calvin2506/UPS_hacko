function deletePath(obj, path) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current || typeof current !== 'object') return;
    current = current[keys[i]];
  }
  if (current && typeof current === 'object') {
    delete current[keys[keys.length - 1]];
  }
}

function stripFields(obj, fieldsToRemove) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => stripFields(item, fieldsToRemove));
  
  const result = { ...obj };
  for (const field of fieldsToRemove) {
    deletePath(result, field);
  }
  return result;
}

module.exports = { stripFields };