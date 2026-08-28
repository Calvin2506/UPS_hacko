import PropTypes from 'prop-types';
import { AlertTriangle, Database, Radio } from 'lucide-react';

const config = {
  live: { label: 'Live', Icon: Radio, className: 'bg-green-50 text-green-700', title: 'Live signal retrieved from the connected data provider.' },
  fallback: { label: 'Estimated', Icon: AlertTriangle, className: 'bg-yellow-50 text-yellow-700', title: 'Using a reliable baseline estimate while a live signal is unavailable.' },
  mocked: { label: 'Simulated', Icon: Database, className: 'bg-stone-100 text-stone-600', title: "Simulates UPS's internal historical shipment records — no public API equivalent exists." },
};

/** Compact provenance label for a risk signal; defaults safely to an estimate. */
export default function DataSourceBadge({ source }) {
  const item = config[source] || config.fallback;
  const { Icon } = item;
  return <span title={item.title} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${item.className}`}><Icon size={11} /> {item.label}</span>;
}

DataSourceBadge.propTypes = { source: PropTypes.oneOf(['live', 'fallback', 'mocked']) };
