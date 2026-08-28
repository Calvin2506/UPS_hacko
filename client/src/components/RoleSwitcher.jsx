import { Users } from 'lucide-react';
import { ROLES, useRole } from '../context/RoleContext';

/** Demo role selector that visibly exercises each UI permission rule. */
export default function RoleSwitcher() {
  const { role, setRole } = useRole();
  return <div className="group relative flex items-center gap-2"><Users size={17} className="text-ups-gold" /><label className="text-xs text-stone-300" htmlFor="role-switcher">Viewing as:</label><select id="role-switcher" value={role} onChange={(event) => setRole(event.target.value)} className="max-w-48 rounded-md border border-white/20 bg-white/10 px-2 py-1.5 text-xs font-semibold text-white outline-none"><>{Object.entries(ROLES).map(([key, config]) => <option key={key} value={key} className="text-slate-900">{config.label}</option>)}</></select><div className="absolute right-0 top-full z-50 mt-2 hidden w-72 rounded-md bg-white p-3 text-xs leading-4 text-stone-600 shadow-lg group-hover:block">Simulated access control for demo — production would integrate with UPS’s identity/SSO system.</div></div>;
}
