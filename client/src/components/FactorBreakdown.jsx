import PropTypes from "prop-types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DataSourceBadge from "./DataSourceBadge";
import HistoricalNote from "./HistoricalNote";

const labelize = (key) =>
  ({
    weather: "Weather",
    portDelay: "Port delay",
    flightDelay: "Flight delay",
    geopolitical: "Geopolitical",
    historicalDelayRate: "History",
  })[key] || key;
const barColor = (score) =>
  score <= 3 ? "#16A34A" : score <= 6 ? "#EAB308" : "#DC2626";

/** Risk factors plotted as independently colored, zero-to-ten bars. */
export default function FactorBreakdown({ breakdown }) {
  const data = Object.entries(breakdown || {})
    .filter(([, value]) => value != null)
    .map(([key, value]) => ({
      name: labelize(key),
      score: typeof value === "number" ? value : value.score,
      fill: barColor(typeof value === "number" ? value : value.score),
      source: typeof value === "number" ? "fallback" : value.source || (key === "historicalDelayRate" ? "mocked" : "fallback"),
      muted: typeof value !== "number" && (value.source || "fallback") === "fallback",
    }));
  if (!data.length) return null;
  return (
    <section title="Hover a bar to see that factor's risk score.">
      <h3 className="mb-3 text-sm font-bold text-ups-brown">
        Risk factor breakdown
      </h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 108 }}
          >
            <CartesianGrid stroke="#e7e5e4" horizontal={false} />
            <XAxis type="number" domain={[0, 10]} tickCount={6} fontSize={11} />
            <YAxis type="category" dataKey="name" width={85} fontSize={11} />
            <Tooltip
              cursor={{ fill: "#f5f5f4" }}
              formatter={(value) => [`${value}/10`, "Risk score"]}
            />
            <Bar dataKey="score" shape={<FactorBar />}>
              <LabelList dataKey="source" content={<SourceLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {data.find((item) => item.name === "History") && <HistoricalNote sampleSize={breakdown?.historicalDelayRate?.sampleSize} delayRatePercent={breakdown?.historicalDelayRate?.delayRatePercent} />}
    </section>
  );
}
FactorBreakdown.propTypes = { breakdown: PropTypes.object };

function SourceLabel({ x, y, width, height, payload }) {
  if (![x, y, width, height].every(Number.isFinite)) return null;
  return <foreignObject x={x + width + 7} y={y + (height - 22) / 2} width={95} height={24}><div xmlns="http://www.w3.org/1999/xhtml"><DataSourceBadge source={payload.source} /></div></foreignObject>;
}
SourceLabel.propTypes = { x: PropTypes.number, y: PropTypes.number, width: PropTypes.number, height: PropTypes.number, payload: PropTypes.object };

function FactorBar({ x, y, width, height, payload }) {
  if (![x, y, width, height].every(Number.isFinite)) return null;
  return <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill={payload.fill} fillOpacity={payload.muted ? 0.45 : 1} />;
}
FactorBar.propTypes = { x: PropTypes.number, y: PropTypes.number, width: PropTypes.number, height: PropTypes.number, payload: PropTypes.object };
