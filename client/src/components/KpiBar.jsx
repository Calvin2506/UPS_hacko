import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CircleDollarSign, Lock, Radio, ShieldCheck } from "lucide-react";
import PropTypes from "prop-types";
import { getSlaSummary } from "../api/shipments";
import { useRole } from "../context/RoleContext";

const cards = (data, coverage) => [
  {
    label: "High Risk",
    value: data.highRiskCount,
    border: "border-red-600",
    icon: AlertTriangle,
    iconColor: "text-red-600",
  },
  {
    label: "Monitor",
    value: data.mediumRiskCount,
    border: "border-yellow-500",
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
  },
  {
    label: "Total $ Exposure",
    value: money(data.totalExposure),
    border: "border-ups-brown",
    icon: CircleDollarSign,
    iconColor: "text-ups-brown",
  },
  {
    label: "Potential Savings",
    value: money(data.totalPotentialSavings),
    border: "border-green-600",
    icon: ShieldCheck,
    iconColor: "text-green-600",
  },
  {
    label: "Live Data Coverage",
    value: coverage === null ? "—" : `${coverage}%`,
    border: "border-green-600",
    icon: Radio,
    iconColor: "text-green-600",
  },
];
const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

/** Fleet-level SLA metrics, independently cached through React Query. */
export default function KpiBar({ shipments = [] }) {
  const { permissions } = useRole();
  const coverageItems = shipments.map((shipment) => shipment.dataFreshness).filter(Boolean).map(({ liveSignalsUsed = 0, fallbackSignalsUsed = 0 }) => {
    const total = liveSignalsUsed + fallbackSignalsUsed;
    return total ? (liveSignalsUsed / total) * 100 : null;
  }).filter((value) => value !== null);
  const coverage = coverageItems.length ? Math.round(coverageItems.reduce((total, value) => total + value, 0) / coverageItems.length) : null;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sla-summary"],
    queryFn: getSlaSummary,
    staleTime: 60_000,
    enabled: permissions.canViewKpiBar,
  });
  if (!permissions.canViewKpiBar) return <div title="KPI summary requires elevated access." className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-500 shadow-sm"><Lock size={17} /> KPI summary requires elevated access</div>;
  if (isLoading)
    return (
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-stone-200" />
        ))}
      </div>
    );
  if (isError)
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Couldn’t load SLA summary.
      </div>
    );
  return (
    <section className="grid grid-cols-5 gap-4" aria-label="Fleet KPIs">
      {cards(data, coverage).map(({ label, value, border, icon: Icon, iconColor }) => (
        <article
          key={label}
          title={`${label}: ${value}. Data comes from the current shipment fleet.`}
          className={`hover-card cursor-help border-l-4 ${border} rounded-lg bg-white p-4 shadow-sm`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="mt-1 text-sm text-stone-500">{label}</p>
            </div>
            <Icon size={20} className={iconColor} />
          </div>
        </article>
      ))}
    </section>
  );
}
KpiBar.propTypes = { shipments: PropTypes.arrayOf(PropTypes.object) };
