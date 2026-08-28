import PropTypes from "prop-types";
import { Search } from "lucide-react";

/** Local-only controls for the already cached shipment list. */
export default function Toolbar({
  search,
  filter,
  sort,
  onSearchChange,
  onFilterChange,
  onSortChange,
}) {
  return (
    <div
      title="Filters and sorting happen locally using the shipments already loaded."
      className="hover-card flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
    >
      <label className="relative min-w-0 flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          size={18}
        />
        <span className="sr-only">Search shipments</span>
        <input
          title="Search shipment ID, origin, or destination without making another API request."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-md border border-stone-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-ups-brown focus:ring-1 focus:ring-ups-brown"
          placeholder="Search ID, origin, or destination"
        />
      </label>
      <select
        title="Limit the list to one transport mode."
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
      >
        <option value="all">All modes</option>
        <option value="air">Air</option>
        <option value="ground">Ground</option>
        <option value="sea">Sea</option>
      </select>
      <select
        title="Urgency weighs risk against time remaining until ETA."
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
      >
        <option value="urgency">Urgency</option>
        <option value="risk">Risk Score</option>
        <option value="eta">ETA</option>
      </select>
    </div>
  );
}
Toolbar.propTypes = {
  search: PropTypes.string.isRequired,
  filter: PropTypes.string.isRequired,
  sort: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onSortChange: PropTypes.func.isRequired,
};
