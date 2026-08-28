import PropTypes from 'prop-types';
import { ArrowRight } from 'lucide-react';
import ModeIcon from './ModeIcon';
import RiskBadge from './RiskBadge';

const dotStyles = { low: 'bg-green-600', medium: 'bg-yellow-500', high: 'bg-red-600' };
const relativeEta = (eta) => {
  const hours = Math.round((new Date(eta) - Date.now()) / 3_600_000);
  if (hours < 0) return `${Math.abs(hours)}h overdue`;
  return hours < 1 ? 'under 1h' : `in ${hours}h`;
};

/** Lightweight shipment table. It never requests detail data. */
export default function ShipmentList({ shipments, isLoading, onSelect }) {
  if (isLoading) return <div className="mt-4 overflow-hidden rounded-lg bg-white shadow-sm">{Array.from({ length: 5 }, (_, i) => <div key={i} className="m-4 h-12 animate-pulse rounded bg-stone-100" />)}</div>;
  if (!shipments.length) return <div className="mt-4 rounded-lg bg-white py-16 text-center text-sm text-stone-500 shadow-sm">No shipments match your search or filters.</div>;
  return <div title="Select a shipment to inspect its detailed risk factors and recommended action." className="hover-card mt-4 overflow-hidden rounded-lg bg-white shadow-sm"><table className="w-full text-left"><thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-5 py-3">Shipment</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Risk</th><th className="px-5 py-3">ETA</th></tr></thead><tbody>{shipments.map((shipment) => <tr key={shipment.id} title={`Open ${shipment.id}: ${shipment.riskLevel} risk, ETA ${relativeEta(shipment.eta)}.`} onClick={() => onSelect(shipment.id)} className="cursor-pointer border-b border-stone-100 text-sm transition-all duration-150 last:border-0 hover:bg-amber-50/40 hover:shadow-sm">
    <td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${dotStyles[shipment.riskLevel]}`} /><span className="rounded-md bg-stone-100 p-2 text-ups-brown"><ModeIcon mode={shipment.mode} /></span><span className="font-semibold text-slate-900">{shipment.id}</span></div></td>
    <td className="px-4 py-4 text-stone-600"><span>{shipment.origin}</span><ArrowRight className="mx-2 inline text-stone-400" size={15} /><span>{shipment.destination}</span></td>
    <td className="px-4 py-4"><RiskBadge riskLevel={shipment.riskLevel} riskScore={shipment.riskScore} /></td><td className="px-5 py-4 font-medium text-slate-700">{relativeEta(shipment.eta)}</td>
  </tr>)}</tbody></table></div>;
}
ShipmentList.propTypes = { shipments: PropTypes.arrayOf(PropTypes.object).isRequired, isLoading: PropTypes.bool, onSelect: PropTypes.func.isRequired };
