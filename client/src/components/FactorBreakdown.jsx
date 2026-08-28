import PropTypes from "prop-types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
            margin={{ left: 8, right: 20 }}
          >
            <CartesianGrid stroke="#e7e5e4" horizontal={false} />
            <XAxis type="number" domain={[0, 10]} tickCount={6} fontSize={11} />
            <YAxis type="category" dataKey="name" width={85} fontSize={11} />
            <Tooltip
              cursor={{ fill: "#f5f5f4" }}
              formatter={(value) => [`${value}/10`, "Risk score"]}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
FactorBreakdown.propTypes = { breakdown: PropTypes.object };
