import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Route, Zap, Battery, Clock, DollarSign, MapPin, Save, ArrowLeft, ChevronDown, ChevronUp, Download, Navigation, Share2 } from 'lucide-react';
import { saveTrip } from '../services/authService';
import { getSoCColor, formatDistance, formatTime, formatEnergy, formatCost } from '../utils/helpers';
import { staggerContainer, staggerItem } from '../animations/variants';
import { exportTripPDF } from '../utils/pdfExport';
import { ShareModal } from '../components/common/ShareModal';
import toast from 'react-hot-toast';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' });

const chargingIcon = new L.DivIcon({
  html: `<div style="background:#00F0FF;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #0B0E14;box-shadow:0 0 8px rgba(0,240,255,0.6)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#0B0E14"><path d="M13 2L4.5 13.5H11L11 22 19.5 10.5H13L13 2Z"/></svg>
  </div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    const soc = payload[0].value;
    return (
      <div className="bg-dark-surface border border-dark-border rounded-xl px-3 py-2 text-sm">
        <p className="text-dark-muted text-xs">{label}</p>
        <p style={{ color: getSoCColor(soc) }} className="font-bold">{soc.toFixed(1)}% SoC</p>
      </div>
    );
  }
  return null;
};

const TripResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tripData, vehicle } = location.state || {};

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAllStops, setShowAllStops] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!tripData) {
      navigate('/route-planner');
      return;
    }
    setTimeout(() => setMapReady(true), 100);
  }, [tripData]);

  if (!tripData) return null;

  const { origin, destination, chargingStops, segments, summary, routeGeometry, stationsAlongRoute, navSteps } = tripData;

  // Build SoC chart data
  const socData = [
    { name: 'Start', soc: vehicle?.usableBatteryPct || 90 },
    ...segments.map((s, i) => ({ name: `Seg ${i + 1}`, soc: Math.max(0, s.socAfterPct) })),
  ];

  // Route coordinates
  const routeCoords = routeGeometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];
  const center = origin?.lat ? [origin.lat, origin.lng] : [40.7128, -74.006];

  const handleSave = async () => {
    if (saved) return;
    setSaving(true);
    try {
      await saveTrip({
        origin, destination, vehicle, routeGeometry, segments,
        chargingStops: chargingStops.map(s => ({ ...s, stationId: s.stationId || 'unknown' })),
        summary,
      });
      setSaved(true);
      toast.success('Trip saved to history!');
    } catch (err) {
      toast.error('Failed to save trip');
    } finally {
      setSaving(false);
    }
  };

  const displayedStops = showAllStops ? chargingStops : chargingStops.slice(0, 3);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/route-planner')} className="p-2 rounded-xl dark:hover:bg-dark-highlight hover:bg-light-highlight dark:text-dark-muted text-light-muted transition-colors" data-testid="back-btn">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-bold dark:text-dark-text text-light-text">
              {origin?.address?.split(',')[0]} → {destination?.address?.split(',')[0]}
            </h2>
            <p className="text-xs dark:text-dark-muted text-light-muted">Trip Analysis Complete</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowShare(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-secondary/30 text-secondary text-sm font-semibold hover:bg-secondary/5 transition-all"
          data-testid="share-trip-btn"
        >
          <Share2 className="w-4 h-4" />
          Share
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => exportTripPDF(tripData, vehicle)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border dark:border-dark-border border-light-border dark:text-dark-text text-light-text text-sm font-semibold dark:hover:bg-dark-highlight hover:bg-light-highlight transition-all"
          data-testid="export-pdf-btn"
        >
          <Download className="w-4 h-4 text-primary" />
          Export PDF
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleSave} disabled={saving || saved}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'volt-btn'} disabled:opacity-60`}
          data-testid="save-trip-btn"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Trip'}
        </motion.button>
      </div>

      {/* Summary Cards */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Route, label: 'Total Distance', value: formatDistance(summary.totalDistanceKm), color: 'text-primary' },
          { icon: Clock, label: 'Total Time', value: formatTime(summary.totalTripTimeMin), color: 'text-secondary' },
          { icon: Zap, label: 'Energy Used', value: formatEnergy(summary.totalEnergyKwh), color: 'text-emerald-400' },
          { icon: DollarSign, label: 'Charging Cost', value: formatCost(summary.totalCostInr != null ? summary.totalCostInr : summary.totalCostUsd), color: 'text-orange-400' },
        ].map((s) => (
          <motion.div key={s.label} variants={staggerItem} className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border p-4" data-testid="summary-card">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-xl font-bold stat-number ${s.color}`}>{s.value}</p>
            <p className="text-xs dark:text-dark-muted text-light-muted mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Map */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border overflow-hidden"
      >
        <div className="p-4 border-b dark:border-dark-border border-light-border">
          <h3 className="font-bold dark:text-dark-text text-light-text text-sm">Route Map</h3>
        </div>
        <div className="h-72">
          {mapReady && routeCoords.length > 0 && (
            <MapContainer center={center} zoom={6} className="w-full h-full" style={{ background: '#0B0E14' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {routeCoords.length > 0 && (
                <Polyline positions={routeCoords} color="#00F0FF" weight={4} opacity={0.9} />
              )}
              {origin?.lat && (
                <Marker position={[origin.lat, origin.lng]}>
                  <Popup className="custom-popup">
                    <strong>Start:</strong> {origin.address}
                  </Popup>
                </Marker>
              )}
              {destination?.lat && (
                <Marker position={[destination.lat, destination.lng]}>
                  <Popup className="custom-popup">
                    <strong>End:</strong> {destination.address}
                  </Popup>
                </Marker>
              )}
              {chargingStops.map((stop, i) => stop.location?.lat && (
                <Marker key={i} position={[stop.location.lat, stop.location.lng]} icon={chargingIcon}>
                  <Popup className="custom-popup">
                    <div className="text-sm">
                      <strong>{stop.stationName}</strong><br />
                      +{stop.energyAddedKwh?.toFixed(1)} kWh ({stop.chargingTimeMin?.toFixed(0)} min)<br />
                      Cost: ${stop.costUsd?.toFixed(2)}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </motion.div>

      {/* SoC Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold dark:text-dark-text text-light-text text-sm">State of Charge (SoC) Curve</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded bg-red-400"></div><span className="text-xs dark:text-dark-muted text-light-muted">Min Reserve ({summary.initialSocPct ? vehicle?.minReserveSocPct : 15}%)</span></div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={socData}>
            <defs>
              <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D3342" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={vehicle?.minReserveSocPct || 15} stroke="#FF3B30" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Area type="monotone" dataKey="soc" stroke="#00F0FF" strokeWidth={2.5} fill="url(#socGrad)" dot={{ fill: '#00F0FF', r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-3 flex items-center gap-4 text-xs dark:text-dark-muted text-light-muted">
          <span>Final SoC: <span className="font-bold" style={{ color: getSoCColor(summary.finalSocPct) }}>{summary.finalSocPct?.toFixed(1)}%</span></span>
          <span>Charging stops: <span className="font-bold text-primary">{summary.numberOfChargingStops}</span></span>
          <span>Driving time: <span className="font-bold text-secondary">{formatTime(summary.totalDrivingTimeMin)}</span></span>
        </div>
      </motion.div>

      {/* Charging Stops */}
      {chargingStops.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border"
        >
          <div className="p-5 border-b dark:border-dark-border border-light-border flex items-center justify-between">
            <h3 className="font-bold dark:text-dark-text text-light-text text-sm">Charging Stops ({chargingStops.length})</h3>
          </div>
          <div className="divide-y dark:divide-dark-border divide-light-border">
            {displayedStops.map((stop, i) => (
              <div key={i} className="p-4 flex items-start gap-4" data-testid="charging-stop-item">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm stat-number">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold dark:text-dark-text text-light-text text-sm truncate">{stop.stationName}</p>
                  <p className="text-xs dark:text-dark-muted text-light-muted truncate">{stop.address}</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="text-xs"><span className="dark:text-dark-muted text-light-muted">Arrive: </span><span className="text-orange-400 font-semibold">{stop.arrivalSocPct?.toFixed(0)}%</span></span>
                    <span className="text-xs"><span className="dark:text-dark-muted text-light-muted">Depart: </span><span className="text-emerald-400 font-semibold">{stop.departureSocPct?.toFixed(0)}%</span></span>
                    <span className="text-xs"><span className="dark:text-dark-muted text-light-muted">+</span><span className="text-primary font-semibold">{stop.energyAddedKwh?.toFixed(1)} kWh</span></span>
                    <span className="text-xs"><span className="dark:text-dark-muted text-light-muted">{stop.chargingTimeMin?.toFixed(0)} min</span></span>
                    <span className="text-xs"><span className="dark:text-dark-muted text-light-muted">₹</span><span className="text-secondary font-semibold">{stop.costUsd?.toFixed(2)}</span></span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs dark:text-dark-muted text-light-muted">{stop.chargingPowerKw} kW</p>
                  <p className="text-xs text-primary">{stop.chargingPowerKw >= 50 ? 'DC Fast' : 'AC'}</p>
                </div>
              </div>
            ))}
          </div>
          {chargingStops.length > 3 && (
            <div className="p-3 border-t dark:border-dark-border border-light-border">
              <button onClick={() => setShowAllStops(!showAllStops)} className="flex items-center gap-1.5 text-sm text-primary hover:underline mx-auto">
                {showAllStops ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Show {chargingStops.length - 3} more stops</>}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Trip Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="grid grid-cols-2 gap-4 text-sm"
      >
        {[
          { label: 'Driving Time', value: formatTime(summary.totalDrivingTimeMin), icon: Clock, color: 'text-primary' },
          { label: 'Charging Time', value: formatTime(summary.totalChargingTimeMin), icon: Zap, color: 'text-secondary' },
          { label: 'Initial SoC', value: `${summary.initialSocPct || vehicle?.usableBatteryPct}%`, icon: Battery, color: 'text-emerald-400' },
          { label: 'Final SoC', value: `${summary.finalSocPct?.toFixed(1)}%`, icon: Battery, color: getSoCColor(summary.finalSocPct) ? 'text-primary' : 'text-red-400' },
        ].map((item) => (
          <div key={item.label} className="dark:bg-dark-surface bg-white rounded-xl border dark:border-dark-border border-light-border p-4 flex items-center gap-3">
            <item.icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
            <div>
              <p className="text-xs dark:text-dark-muted text-light-muted">{item.label}</p>
              <p className={`font-bold stat-number ${item.color}`}>{item.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Turn-by-Turn Navigation */}
      {navSteps?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border"
        >
          <button
            onClick={() => setShowNav(!showNav)}
            className="w-full p-5 flex items-center justify-between"
            data-testid="toggle-nav-btn"
          >
            <div className="flex items-center gap-3">
              <Navigation className="w-4 h-4 text-secondary" />
              <span className="font-bold dark:text-dark-text text-light-text text-sm">Turn-by-Turn Navigation ({navSteps.length} steps)</span>
            </div>
            {showNav ? <ChevronUp className="w-4 h-4 dark:text-dark-muted text-light-muted" /> : <ChevronDown className="w-4 h-4 dark:text-dark-muted text-light-muted" />}
          </button>

          {showNav && (
            <div className="border-t dark:border-dark-border border-light-border divide-y dark:divide-dark-border divide-light-border max-h-96 overflow-y-auto">
              {navSteps.map((step, i) => {
                const maneuverIcons = {
                  depart: '🚀', arrive: '🏁', turn: '↩', 'new name': '→', merge: '⤵',
                  'on ramp': '⤴', 'off ramp': '⤵', fork: '⑂', roundabout: '⟳',
                  rotary: '⟳', straight: '↑', default: '→',
                };
                const modIcons = { left: '←', right: '→', straight: '↑', 'slight left': '↖', 'slight right': '↗', 'sharp left': '◄', 'sharp right': '►', uturn: '↩' };
                const icon = modIcons[step.modifier] || maneuverIcons[step.type] || maneuverIcons.default;

                return (
                  <div key={i} className="flex items-start gap-3 px-5 py-3 hover:dark:bg-dark-highlight hover:bg-light-highlight transition-colors" data-testid="nav-step">
                    <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-secondary">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm dark:text-dark-text text-light-text">{step.instruction}</p>
                      {step.road && <p className="text-xs text-primary font-medium mt-0.5">{step.road}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold dark:text-dark-text text-light-text stat-number">{step.distanceKm?.toFixed(1)} km</p>
                      <p className="text-xs dark:text-dark-muted text-light-muted">{step.durationMin?.toFixed(0)} min</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Share Modal */}
      {showShare && <ShareModal tripData={tripData} vehicle={vehicle} onClose={() => setShowShare(false)} />}
    </div>
  );
};

export default TripResultsPage;
