import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { setApiRole } from '../api/client';

export const ROLES = {
  dispatcher: { label: 'Dispatcher / Ops Executive', canViewCost: true, canViewBreakdown: true, canRecalculate: true, canMarkActioned: true, canViewMap: true, canViewAllModes: true, canViewKpiBar: true },
  warehouse: { label: 'Warehouse / Ground Staff', canViewCost: false, canViewBreakdown: false, canRecalculate: false, canMarkActioned: false, canViewAllModes: false, canViewMap: false, canViewKpiBar: false },
  manager: { label: 'Regional Manager', canViewCost: true, canViewBreakdown: true, canRecalculate: false, canMarkActioned: false, canViewMap: true, canViewAllModes: true, canViewKpiBar: true },
  customerService: { label: 'Customer Service', canViewCost: false, canViewBreakdown: false, canRecalculate: false, canMarkActioned: false, canViewMap: false, canViewAllModes: true, canViewKpiBar: false },
};

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRole] = useState('dispatcher');
  useEffect(() => { setApiRole(role); }, [role]);
  const value = useMemo(() => ({ role, setRole, permissions: ROLES[role] }), [role]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const value = useContext(RoleContext);
  if (!value) throw new Error('useRole must be used inside RoleProvider');
  return value;
}

RoleProvider.propTypes = { children: PropTypes.node.isRequired };
