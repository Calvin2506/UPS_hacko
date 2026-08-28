const ROLE_PERMISSIONS = {
  dispatcher: { canViewCost: true, canViewBreakdown: true, canViewAllModes: true },
  warehouse: { canViewCost: false, canViewBreakdown: false, canViewAllModes: false },
  manager: { canViewCost: true, canViewBreakdown: true, canViewAllModes: true },
  customerService: { canViewCost: false, canViewBreakdown: false, canViewAllModes: true },
};

module.exports = ROLE_PERMISSIONS;