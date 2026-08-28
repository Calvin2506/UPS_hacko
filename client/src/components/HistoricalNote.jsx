import PropTypes from 'prop-types';

/** Context for the simulated historical-delay signal used in the risk model. */
export default function HistoricalNote({ sampleSize, delayRatePercent }) {
  const hasFigures = Number.isFinite(sampleSize) && Number.isFinite(delayRatePercent);
  return <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs leading-4 text-stone-600">📊 {hasFigures ? `Based on ${sampleSize} simulated past shipments (${delayRatePercent}% delay rate)` : 'Based on simulated past shipment patterns'} — represents the kind of internal historical pattern UPS’s real system would draw from.</div>;
}

HistoricalNote.propTypes = { sampleSize: PropTypes.number, delayRatePercent: PropTypes.number };
