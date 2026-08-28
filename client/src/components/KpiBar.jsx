import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CircleDollarSign, ShieldCheck } from "lucide-react";
import { getSlaSummary } from "../api/shipments";

const cards = (data) => [
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
];
const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

/** Fleet-level SLA metrics, independently cached through React Query. */
export default function KpiBar() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sla-summary"],
    queryFn: getSlaSummary,
    staleTime: 60_000,
  });
  if (isLoading)
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
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
    <section className="grid grid-cols-4 gap-4" aria-label="Fleet KPIs">
      {cards(data).map(({ label, value, border, icon: Icon, iconColor }) => (
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
