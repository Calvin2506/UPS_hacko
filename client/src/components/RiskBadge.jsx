import PropTypes from 'prop-types';

const styles = {
  low: 'bg-green-600',
  medium: 'bg-yellow-500 text-slate-950',
  high: 'bg-red-600',
};

/** Displays a shipment risk score and normalized risk label. */
export default function RiskBadge({ riskLevel, riskScore, compact = false }) {
  const level = (riskLevel || 'low').toLowerCase();
  return <span title={`Risk score ${riskScore} out of 10 — ${level} risk`} className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold tracking-wide ${styles[level] || styles.low}`}>
    {riskScore}/10{!compact && ` ${level.toUpperCase()}`}
  </span>;
}

RiskBadge.propTypes = { riskLevel: PropTypes.string, riskScore: PropTypes.number.isRequired, compact: PropTypes.bool };
