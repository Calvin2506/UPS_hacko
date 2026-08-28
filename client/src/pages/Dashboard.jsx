import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, PackageSearch } from "lucide-react";
import { getShipments } from "../api/shipments";
import DetailPanel from "../components/DetailPanel";
import KpiBar from "../components/KpiBar";
import ShipmentList from "../components/ShipmentList";
import Toolbar from "../components/Toolbar";

const urgency = (shipment) =>
  shipment.riskScore /
  Math.max((new Date(shipment.eta) - Date.now()) / 3_600_000, 0.25);

/** Dashboard state owns list filtering/sorting and selection, all without refetching. */
export default function Dashboard() {
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("urgency");
  const shipmentsQuery = useQuery({
    queryKey: ["shipments"],
    queryFn: getShipments,
    staleTime: 5 * 60_000,
  });
  const shipments = useMemo(() => {
    const phrase = search.trim().toLowerCase();
    return [...(shipmentsQuery.data || [])]
      .filter((shipment) => filter === "all" || shipment.mode === filter)
      .filter(
        (shipment) =>
          !phrase ||
          [shipment.id, shipment.origin, shipment.destination].some((value) =>
            value?.toLowerCase().includes(phrase),
          ),
      )
      .sort((a, b) =>
        sort === "risk"
          ? b.riskScore - a.riskScore
          : sort === "eta"
            ? new Date(a.eta) - new Date(b.eta)
            : urgency(b) - urgency(a),
      );
  }, [shipmentsQuery.data, search, filter, sort]);
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="bg-ups-brown text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/ups-logo.webp"
              alt="UPS"
              title="UPS Delivery Risk Score"
              className="h-12 w-20 rounded object-contain"
            />
            <div>
              <h1 className="text-lg font-bold leading-tight">
                Shipment Risk Tracker
              </h1>
              <p className="text-xs text-stone-300">
                Shipment operations dashboard
              </p>
            </div>
          </div>
          <div
            title="Dashboard is connected to live API data."
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold"
          >
            <Activity size={14} className="text-ups-gold" /> Live
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-5 px-8 py-7">
        <KpiBar />
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Active shipments
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Prioritize actions before delivery commitments are at risk.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-sm text-stone-500 md:flex">
            <PackageSearch size={18} /> {shipmentsQuery.data?.length || 0}{" "}
            tracked
          </div>
        </div>
        <Toolbar
          search={search}
          filter={filter}
          sort={sort}
          onSearchChange={setSearch}
          onFilterChange={setFilter}
          onSortChange={setSort}
        />
        <ShipmentList
          shipments={shipments}
          isLoading={shipmentsQuery.isLoading}
          onSelect={setSelectedId}
        />
        {shipmentsQuery.isError && (
          <p className="rounded bg-red-50 p-4 text-sm text-red-700">
            Couldn’t load shipment list. Confirm the API server is running on
            port 3001.
          </p>
        )}
      </main>
      {selectedId && (
        <DetailPanel
          shipmentId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
