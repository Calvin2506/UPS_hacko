import { Radio } from "lucide-react";
import { useSyncExternalStore } from "react";
import { networkStats } from "../api/networkStats";

/** Session-only network usage indicator fed by the shared Axios interceptor. */
export default function NetworkStatsBadge() {
  const { calls, bytes } = useSyncExternalStore(
    networkStats.subscribe,
    networkStats.getSnapshot,
    networkStats.getSnapshot,
  );
  const kb = Math.max(0, Math.round(bytes / 1024));
  return (
    <div
      title="Session API usage. Hover to compare it with a polling-based dashboard."
      className="group fixed bottom-5 right-5 z-50 rounded-full border border-stone-300 bg-white/90 px-3 py-2 text-xs font-semibold text-ups-brown shadow-lg backdrop-blur transition-all hover:pr-5"
    >
      <span className="flex items-center gap-1.5">
        <Radio size={14} className="text-ups-gold" /> {calls} calls · {kb}KB
      </span>
      <span className="hidden pt-1 text-[10px] font-normal text-stone-500 group-hover:block">
        vs ~180KB with polling
      </span>
    </div>
  );
}
