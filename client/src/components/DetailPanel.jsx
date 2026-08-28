import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Lightbulb, LoaderCircle, X } from "lucide-react";
import {
  actionShipment,
  getShipmentDetail,
  recalculateShipment,
} from "../api/shipments";
import FactorBreakdown from "./FactorBreakdown";
import ModeIcon from "./ModeIcon";
import RiskBadge from "./RiskBadge";

const cash = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount || 0);
const adjustedEta = (date) =>
  date
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(date))
    : "—";

/** Lazy-loaded slide-over, including explicit recalculation and action mutations. */
export default function DetailPanel({ shipmentId, onClose }) {
  const queryClient = useQueryClient();
  const [actioned, setActioned] = useState(false);
  const [toast, setToast] = useState("");
  const query = useQuery({
    queryKey: ["shipment", shipmentId],
    queryFn: () => getShipmentDetail(shipmentId),
    enabled: Boolean(shipmentId),
    staleTime: 5 * 60_000,
  });
  useEffect(() => {
    setActioned(false);
    setToast("");
  }, [shipmentId]);
  const updateCaches = (updated) => {
    queryClient.setQueryData(["shipment", shipmentId], updated);
    queryClient.invalidateQueries({ queryKey: ["shipments"] });
    queryClient.invalidateQueries({ queryKey: ["sla-summary"] });
  };
  const recalculate = useMutation({
    mutationFn: () => recalculateShipment(shipmentId),
    onSuccess: updateCaches,
  });
  const action = useMutation({
    mutationFn: () => actionShipment(shipmentId),
    onSuccess: (updated) => {
      updateCaches(updated);
      setActioned(true);
      setToast(
        `Estimated ${cash(updated?.sla?.savingsIfActioned?.estimatedSavings)} saved`,
      );
    },
  });
  const data = query.data;
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/25"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-[510px] max-w-[94vw] flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-200"
        aria-label="Shipment detail"
      >
        <div className="flex items-start justify-between border-b border-stone-200 p-6">
          {data ? (
            <div
              title={`${data.mode} shipment from ${data.origin} to ${data.destination}`}
            >
              <div className="flex items-center gap-2 text-ups-brown">
                <ModeIcon mode={data.mode} />
                <span className="font-bold">{data.id}</span>
              </div>
              <p className="mt-2 text-sm text-stone-600">
                {data.origin} → {data.destination}
              </p>
            </div>
          ) : (
            <div className="h-10 w-48 animate-pulse rounded bg-stone-200" />
          )}
          <button
            title="Close shipment detail"
            onClick={onClose}
            className="rounded p-1 text-stone-500 hover:bg-stone-100"
            aria-label="Close"
          >
            <X />
          </button>
        </div>
        {query.isLoading && (
          <div className="space-y-4 p-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded bg-stone-100"
              />
            ))}
          </div>
        )}
        {query.isError && (
          <p className="m-6 rounded bg-red-50 p-4 text-sm text-red-700">
            Couldn’t load shipment detail. Please try again.
          </p>
        )}
        {data && (
          <div className="space-y-6 p-6">
            <div
              title="The overall risk score is calculated from the factor breakdown below."
              className="flex items-end justify-between"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Delivery risk
                </p>
                <p className="mt-1 text-5xl font-bold text-ups-brown">
                  {data.riskScore}
                  <span className="text-xl text-stone-400">/10</span>
                </p>
              </div>
              <RiskBadge
                riskLevel={data.riskLevel}
                riskScore={data.riskScore}
              />
            </div>
            <div className="hover-card grid grid-cols-3 divide-x divide-stone-200 rounded-lg bg-stone-50 py-3 text-center">
              <Metric
                label="Breach probability"
                value={`${data.sla?.breachProbability ?? "—"}%`}
              />
              <Metric
                label="Cost exposure"
                value={cash(data.sla?.cost?.expectedCost)}
              />
              <Metric
                label="Suggested buffer"
                value={`${data.sla?.buffer?.bufferHours ?? "—"}h`}
              />
            </div>
            <p className="-mt-4 text-center text-xs text-stone-500">
              Adjusted ETA: {adjustedEta(data.sla?.buffer?.adjustedEta)}
            </p>
            <FactorBreakdown breakdown={data.breakdown} />
            <div className="hover-card rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-2">
                <Lightbulb
                  size={18}
                  className="mt-0.5 shrink-0 text-ups-brown"
                />
                <div>
                  <h3 className="text-sm font-bold text-ups-brown">
                    Recommendation
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-stone-700">
                    {data.recommendation}
                  </p>
                </div>
              </div>
            </div>
            {toast && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm font-semibold text-green-700">
                <Check size={16} /> {toast}
              </div>
            )}
            <div className="flex gap-3">
              <button
                title="Refresh the risk score using the latest available signals."
                onClick={() => recalculate.mutate()}
                disabled={recalculate.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-md border border-ups-brown px-4 py-2.5 text-sm font-bold text-ups-brown disabled:opacity-60"
              >
                {recalculate.isPending && (
                  <LoaderCircle className="animate-spin" size={16} />
                )}
                {recalculate.isPending ? "Refreshing" : "Recalculate"}
              </button>
              <button
                title={
                  actioned
                    ? "This shipment has already been actioned."
                    : "Mark this shipment actioned and record its estimated savings."
                }
                onClick={() => action.mutate()}
                disabled={actioned || action.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-ups-gold px-4 py-2.5 text-sm font-bold text-ups-brown disabled:cursor-not-allowed disabled:opacity-55"
              >
                {actioned ? (
                  <>
                    <Check size={16} /> Actioned
                  </>
                ) : action.isPending ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  "Mark Actioned"
                )}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
function Metric({ label, value }) {
  return (
    <div className="px-2">
      <p className="text-base font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-[10px] uppercase leading-3 text-stone-500">
        {label}
      </p>
    </div>
  );
}
DetailPanel.propTypes = {
  shipmentId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
Metric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};
