import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { Pause, Plane, Play, TriangleAlert } from 'lucide-react';
import { cityCoords, flightPaths, getHeading, getPositionAlongPath, isNearRiskZone, riskZones } from '../utils/mapData';
import 'leaflet/dist/leaflet.css';

const colors = { low: '#16A34A', medium: '#EAB308', high: '#DC2626' };
const markerIcon = (color, content = '●') => L.divIcon({ className: 'traffic-marker', html: `<span style="display:grid;place-items:center;width:28px;height:28px;border-radius:999px;background:${color};border:3px solid white;box-shadow:0 1px 5px #444;color:white;font-size:16px;font-weight:800">${content}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] });
const planeIcon = (heading) => L.divIcon({ className: 'traffic-plane', html: `<span style="display:block;color:#351C15;font-size:25px;line-height:25px;text-shadow:0 1px 3px white;transform:rotate(${heading}deg)">✈</span>`, iconSize: [30, 30], iconAnchor: [15, 15] });
const eta = (value) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

/** Static map: all map data and flight motion is client-side and requires no tracking API. */
export default function TrafficMap({ shipments }) {
  const [showFlights, setShowFlights] = useState(false);
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const [showZones, setShowZones] = useState(true);
  const [progress, setProgress] = useState(0);
  const [warning, setWarning] = useState(null);
  const routes = useMemo(() => shipments.filter((shipment) => !highRiskOnly || shipment.riskScore >= 7).filter((shipment) => cityCoords[shipment.origin] && cityCoords[shipment.destination]), [shipments, highRiskOnly]);
  const flights = useMemo(() => routes.filter((shipment) => shipment.mode === 'air' && flightPaths[shipment.id]), [routes]);

  useEffect(() => {
    if (!showFlights || !flights.length) return undefined;
    const timer = window.setInterval(() => setProgress((current) => (current + 0.005) % 1), 100);
    return () => window.clearInterval(timer);
  }, [showFlights, flights.length]);

  useEffect(() => {
    if (!showFlights) { setWarning(null); return undefined; }
    const active = flights.map((shipment) => ({ shipment, zone: isNearRiskZone(getPositionAlongPath(flightPaths[shipment.id], progress)) })).find(({ zone }) => zone);
    if (!active) return undefined;
    setWarning(active);
    const timer = window.setTimeout(() => setWarning(null), 2800);
    return () => window.clearTimeout(timer);
  }, [progress, showFlights, flights]);

  return <section className="overflow-hidden rounded-xl bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900">Live Traffic Map</h2><p className="text-sm text-stone-500">Routes and risk hotspots for active India shipments.</p></div><button onClick={() => setShowFlights((value) => !value)} className="inline-flex items-center gap-2 rounded-md bg-ups-gold px-3 py-2 text-sm font-bold text-ups-brown">{showFlights ? <Pause size={16} /> : <Play size={16} />} {showFlights ? 'Pause simulations' : 'Play flight simulations'}</button></div>
    <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 rounded-lg bg-stone-50 px-4 py-3 text-sm text-stone-700"><Toggle checked={showFlights} onChange={setShowFlights} label="Show flight simulations" /><Toggle checked={highRiskOnly} onChange={setHighRiskOnly} label="Show only high-risk routes" /><Toggle checked={showZones} onChange={setShowZones} label="Show risk zones" /></div>
    {warning && <div className="mb-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"><TriangleAlert size={17} /> Entering high-risk zone — {warning.zone.label}, severity {warning.zone.severity}/10</div>}
    <div className="relative h-[560px] overflow-hidden rounded-lg border border-stone-200"><MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom className="h-full w-full"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {routes.flatMap((shipment) => { const origin = cityCoords[shipment.origin]; const destination = cityCoords[shipment.destination]; const path = shipment.mode === 'air' && flightPaths[shipment.id] ? flightPaths[shipment.id] : [origin, destination]; const color = colors[shipment.riskLevel] || colors.low; return [<Polyline key={`${shipment.id}-line`} positions={path} pathOptions={{ color, weight: 4, dashArray: shipment.riskScore >= 7 ? '9 7' : undefined, opacity: 0.82 }} />, <RouteMarker key={`${shipment.id}-origin`} position={origin} shipment={shipment} label="Origin" color={color} />, <RouteMarker key={`${shipment.id}-destination`} position={destination} shipment={shipment} label="Destination" color={color} />]; })}
      {showZones && riskZones.map((zone) => <Marker key={zone.label} position={zone} icon={markerIcon(zone.severity >= 7 ? '#DC2626' : '#EAB308', '⚠')}><Popup><strong>{zone.label}</strong><br />{zone.type} risk · severity {zone.severity}/10</Popup></Marker>)}
      {showFlights && flights.map((shipment) => <Flight key={shipment.id} shipment={shipment} progress={progress} />)}
    </MapContainer><Legend /></div>
    {!routes.length && <p className="py-5 text-center text-sm text-stone-500">No mappable shipments match these controls. Shipments without supported city coordinates are safely skipped.</p>}
  </section>;
}

function Toggle({ checked, onChange, label }) { return <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-[#351C15]" /> {label}</label>; }
function RouteMarker({ position, shipment, label, color }) { return <Marker position={position} icon={markerIcon(color)}><Popup><strong>{shipment.id} · {label}</strong><br />Risk: {shipment.riskScore}/10<br />ETA: {eta(shipment.eta)}</Popup></Marker>; }
function Flight({ shipment, progress }) { const path = flightPaths[shipment.id]; const position = getPositionAlongPath(path, progress); const segment = Math.min(Math.floor(progress * (path.length - 1)), path.length - 2); const heading = getHeading(path[segment], path[segment + 1]); return <Marker position={position} icon={planeIcon(heading)} zIndexOffset={1000}><Tooltip direction="top" offset={[0, -15]}>{shipment.id} simulated flight</Tooltip></Marker>; }
function Legend() { return <div className="absolute bottom-3 left-3 z-[500] rounded-lg bg-white/95 p-3 text-xs text-stone-700 shadow-md"><p className="mb-2 font-bold text-ups-brown">Map legend</p><p><span className="mr-1 text-green-600">●</span> Low · <span className="text-yellow-600">●</span> Monitor · <span className="text-red-600">●</span> High risk</p><p className="mt-1">— solid normal · -- dashed urgent</p><p className="mt-1"><Plane className="mr-1 inline" size={13} /> simulated aircraft · ⚠ risk zone</p><p className="mt-2 text-[10px] text-stone-500">Flight paths simulated for demonstration.</p></div>; }

TrafficMap.propTypes = { shipments: PropTypes.arrayOf(PropTypes.object).isRequired };
Toggle.propTypes = { checked: PropTypes.bool.isRequired, onChange: PropTypes.func.isRequired, label: PropTypes.string.isRequired };
RouteMarker.propTypes = { position: PropTypes.object.isRequired, shipment: PropTypes.object.isRequired, label: PropTypes.string.isRequired, color: PropTypes.string.isRequired };
Flight.propTypes = { shipment: PropTypes.object.isRequired, progress: PropTypes.number.isRequired };
