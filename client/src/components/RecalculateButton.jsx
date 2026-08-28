import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { LoaderCircle, Lock } from 'lucide-react';

const statuses = ['Fetching live weather...', 'Checking flight status...', 'Scanning news signals...', 'Computing risk score...'];

/** Demo-friendly recalculation control that makes signal ingestion visible. */
export default function RecalculateButton({ allowed, pending, onClick }) {
  const [step, setStep] = useState(0);
  useEffect(() => { if (!pending) { setStep(0); return undefined; } const timer = setInterval(() => setStep((value) => (value + 1) % statuses.length), 850); return () => clearInterval(timer); }, [pending]);
  return <button title={allowed ? 'Refresh the risk score using the latest available signals.' : 'Requires Dispatcher access.'} onClick={onClick} disabled={pending || !allowed} className="flex flex-1 items-center justify-center gap-2 rounded-md border border-ups-brown px-4 py-2.5 text-sm font-bold text-ups-brown disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400 disabled:opacity-100">{!allowed ? <><Lock size={16} /> Recalculate</> : pending ? <><LoaderCircle className="animate-spin" size={16} /> {statuses[step]}</> : 'Recalculate'}</button>;
}

RecalculateButton.propTypes = { allowed: PropTypes.bool.isRequired, pending: PropTypes.bool.isRequired, onClick: PropTypes.func.isRequired };
