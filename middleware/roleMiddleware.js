// DEMO ONLY — a real implementation would derive role from a verified JWT/session, not a client-supplied header
const ALLOWED_ROLES = ['dispatcher', 'warehouse', 'manager', 'customerService'];

function attachRole(req, res, next) {
  const role = req.headers['x-user-role'];
  const validRole = ALLOWED_ROLES.includes(role) ? role : 'dispatcher';
  req.userRole = validRole;
  next();
}

module.exports = { attachRole };