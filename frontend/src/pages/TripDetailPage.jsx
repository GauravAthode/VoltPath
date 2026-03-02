import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Clock, Zap, Route, Battery, Navigation,
  Download, Trash2, ChevronDown, ChevronUp, Car, Share2,
} from 'lucide-react';
import { getTripById, deleteTrip } from '../services/authService';
import { exportTripPDF } from '../utils/pdfExport';
import { formatDistance, formatTime, formatCost } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ShareModal } from '../components/common/ShareModal';
import toast from 'react-hot-toast';

const maneuverIcon = (type) => {
  const icons = {
    turn: '↪', 'new name': '→', arrive: '⬛', depart: '▶',
    merge: '⇌', 'on ramp': '↗', 'off ramp': '↙', fork: '⑂',
    roundabout: '↺', rotary: '↺', straight: '↑', default: '→',
  };
  return icons[type] || icons.default;
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="dark:bg-dark-highlight bg-light-highlight rounded-xl p-4 flex items-center gap-3">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-xs dark:text-dark-muted text-light-muted">{label}</p>
      <p className="font-bold stat-number dark:text-dark-text text-light-text text-sm">{value}</p>
    </div>
  </div>
);

const TripDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNav, setShowNav] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    getTripById(id)
      .then(res => setTrip(res.data.data))
      .catch(() => toast.error('Trip not found'))
      .finally(() => setLoading(false));
  }, [id]);

  // Init Leaflet map once trip data is loaded
  useEffect(() => {
    if (!trip || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Draw route
    if (trip.routeGeometry?.coordinates?.length) {
      const latlngs = trip.routeGeometry.coordinates.map(([lng, lat]) => [lat, lng]);
      L.polyline(latlngs, { color: '#00F0FF', weight: 4, opacity: 0.85 }).addTo(map);
      map.fitBounds(L.polyline(latlngs).getBounds(), { padding: [40, 40] });
    }

    // Origin marker
    if (trip.origin?.lat) {
      L.circleMarker([trip.origin.lat, trip.origin.lng], { radius: 8, color: '#CCFF00', fillColor: '#CCFF00', fillOpacity: 1, weight: 2 })
        .bindPopup(`<b>Start</b><br>${trip.origin.address}`).addTo(map);
    }

    // Destination marker
    if (trip.destination?.lat) {
      L.circleMarker([trip.destination.lat, trip.destination.lng], { radius: 8, color: '#FF6B35', fillColor: '#FF6B35', fillOpacity: 1, weight: 2 })
        .bindPopup(`<b>End</b><br>${trip.destination.address}`).addTo(map);
    }

    // Charging stop markers
    (trip.chargingStops || []).forEach((stop, i) => {
      if (stop.location?.lat) {
        L.circleMarker([stop.location.lat, stop.location.lng], { radius: 7, color: '#CCFF00', fillColor: '#111418', fillOpacity: 1, weight: 2 })
          .bindPopup(`<b>Stop ${i + 1}: ${stop.stationName || 'Charging Stop'}</b><br>${stop.chargingTimeMin?.toFixed(0)} min charging`).addTo(map);
      }
    });
  }, [trip]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this trip?')) return;
    setDeleting(true);
    try {
      await deleteTrip(id);
      toast.success('Trip deleted');
      navigate('/history');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" text="Loading trip..." /></div>;
  if (!trip) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Route className="w-12 h-12 dark:text-dark-muted text-light-muted opacity-30" />
      <p className="dark:text-dark-muted text-light-muted">Trip not found</p>
      <button onClick={() => navigate('/history')} className="px-4 py-2 volt-btn rounded-xl text-sm">Back to History</button>
    </div>
  );

  const { summary, origin, destination, chargingStops = [], navSteps = [], vehicle } = trip;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/history')} className="p-2 rounded-xl dark:hover:bg-dark-highlight hover:bg-light-highlight transition-colors" data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 dark:text-dark-muted text-light-muted" />
          </button>
          <div>
            <h2 className="text-xl font-bold dark:text-dark-text text-light-text">Trip Details</h2>
            <p className="text-xs dark:text-dark-muted text-light-muted mt-0.5">
              {new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-secondary/30 text-secondary text-sm font-medium hover:bg-secondary/5 transition-colors"
            data-testid="share-trip-btn"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button
            onClick={() => exportTripPDF(trip, vehicle)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
            data-testid="export-pdf-btn"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button
            onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-400/30 text-red-400 text-sm font-medium hover:bg-red-400/5 transition-colors disabled:opacity-50"
            data-testid="delete-trip-btn"
          >
            {deleting ? <LoadingSpinner size="sm" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>

      {/* Route Title */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border p-5"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary flex-shrink-0" />
            <p className="font-semibold dark:text-dark-text text-light-text text-sm">{origin?.address?.split(',').slice(0, 2).join(',')}</p>
          </div>
          <div className="flex-1 h-px dark:bg-dark-border bg-light-border" />
          <Route className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 h-px dark:bg-dark-border bg-light-border" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-400 flex-shrink-0" />
            <p className="font-semibold dark:text-dark-text text-light-text text-sm">{destination?.address?.split(',').slice(0, 2).join(',')}</p>
          </div>
        </div>
        {vehicle?.name && (
          <div className="flex items-center gap-1.5 mt-3">
            <Car className="w-3.5 h-3.5 dark:text-dark-muted text-light-muted" />
            <span className="text-xs dark:text-dark-muted text-light-muted">{vehicle.name}</span>
          </div>
        )}
      </motion.div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatCard icon={MapPin} label="Total Distance" value={formatDistance(summary?.totalDistanceKm)} color="bg-primary/10 text-primary" />
        <StatCard icon={Clock} label="Total Time" value={formatTime(summary?.totalTripTimeMin)} color="bg-secondary/10 text-secondary" />
        <StatCard icon={Zap} label="Charging Stops" value={`${summary?.numberOfChargingStops || 0} stops`} color="bg-emerald-400/10 text-emerald-400" />
        <StatCard icon={Route} label="Trip Cost" value={formatCost(summary?.totalCostInr ?? summary?.totalCostUsd)} color="bg-orange-400/10 text-orange-400" />
      </motion.div>

      {/* Map */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border overflow-hidden"
      >
        <div className="px-5 py-3 border-b dark:border-dark-border border-light-border flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary" />
          <h3 className="font-bold dark:text-dark-text text-light-text text-sm">Route Map</h3>
          <div className="ml-auto flex items-center gap-3 text-xs dark:text-dark-muted text-light-muted">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" /> Start</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> End</span>
            {chargingStops.length > 0 && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2 border-secondary bg-dark-bg inline-block" /> Charge</span>}
          </div>
        </div>
        <div ref={mapRef} style={{ height: '340px' }} data-testid="trip-detail-map" />
      </motion.div>

      {/* Charging Stops */}
      {chargingStops.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border p-5"
        >
          <h3 className="font-bold dark:text-dark-text text-light-text text-sm mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-secondary" /> Charging Stops ({chargingStops.length})
          </h3>
          <div className="space-y-3">
            {chargingStops.map((stop, i) => (
              <div key={i} className="rounded-xl dark:bg-dark-highlight bg-light-highlight p-4 flex flex-wrap items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-secondary">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold dark:text-dark-text text-light-text text-sm truncate">{stop.stationName || `Charging Stop ${i + 1}`}</p>
                  <p className="text-xs dark:text-dark-muted text-light-muted truncate">{stop.address || '—'}</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: 'SoC', value: `${stop.arrivalSocPct?.toFixed(0)}% → ${stop.departureSocPct?.toFixed(0)}%`, color: 'text-primary' },
                    { label: 'Energy', value: `${stop.energyAddedKwh?.toFixed(1)} kWh`, color: 'text-secondary' },
                    { label: 'Time', value: `${stop.chargingTimeMin?.toFixed(0)} min`, color: 'text-emerald-400' },
                    { label: 'Cost', value: `₹${(stop.costUsd || 0).toFixed(2)}`, color: 'text-orange-400' },
                  ].map(item => (
                    <div key={item.label} className="text-center">
                      <p className="text-xs dark:text-dark-muted text-light-muted">{item.label}</p>
                      <p className={`text-sm font-bold stat-number ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                  <div className="text-center">
                    <p className="text-xs dark:text-dark-muted text-light-muted">Power</p>
                    <p className="text-sm font-bold stat-number dark:text-dark-text text-light-text">{stop.chargingPowerKw} kW</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Battery & Energy Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border p-5">
          <h3 className="font-bold dark:text-dark-text text-light-text text-sm mb-4 flex items-center gap-2">
            <Battery className="w-4 h-4 text-primary" /> Energy & Timing
          </h3>
          {[
            { label: 'Total Distance', value: `${summary?.totalDistanceKm?.toFixed(1)} km` },
            { label: 'Driving Time', value: formatTime(summary?.totalDrivingTimeMin) },
            { label: 'Charging Time', value: formatTime(summary?.totalChargingTimeMin) },
            { label: 'Total Energy Used', value: `${summary?.totalEnergyKwh?.toFixed(1)} kWh` },
            { label: 'Final Battery SoC', value: `${summary?.finalSocPct?.toFixed(1)}%` },
          ].map(item => (
            <div key={item.label} className="flex justify-between py-2 border-b dark:border-dark-border/50 border-light-border/50 last:border-0">
              <span className="text-xs dark:text-dark-muted text-light-muted">{item.label}</span>
              <span className="text-sm font-semibold dark:text-dark-text text-light-text stat-number">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border p-5">
          <h3 className="font-bold dark:text-dark-text text-light-text text-sm mb-4 flex items-center gap-2">
            <Car className="w-4 h-4 text-secondary" /> Vehicle Used
          </h3>
          {vehicle ? [
            { label: 'Vehicle', value: vehicle.name || '—' },
            { label: 'Battery Capacity', value: `${vehicle.batteryCapacityKwh} kWh` },
            { label: 'Efficiency', value: `${vehicle.efficiencyKwhPer100km} kWh/100km` },
            { label: 'Max Charging Power', value: `${vehicle.chargingPowerKw} kW` },
            { label: 'Electricity Rate', value: `₹${vehicle.electricityRatePerKwh}/kWh` },
          ].map(item => (
            <div key={item.label} className="flex justify-between py-2 border-b dark:border-dark-border/50 border-light-border/50 last:border-0">
              <span className="text-xs dark:text-dark-muted text-light-muted">{item.label}</span>
              <span className="text-sm font-semibold dark:text-dark-text text-light-text">{item.value}</span>
            </div>
          )) : <p className="text-sm dark:text-dark-muted text-light-muted">No vehicle data</p>}
        </div>
      </motion.div>

      {/* Turn-by-Turn Navigation */}
      {navSteps.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border overflow-hidden"
        >
          <button
            onClick={() => setShowNav(!showNav)}
            className="w-full px-5 py-4 flex items-center justify-between hover:dark:bg-dark-highlight hover:bg-light-highlight transition-colors"
            data-testid="toggle-nav-btn"
          >
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-primary" />
              <h3 className="font-bold dark:text-dark-text text-light-text text-sm">Turn-by-Turn Navigation</h3>
              <span className="text-xs dark:text-dark-muted text-light-muted">({navSteps.length} steps)</span>
            </div>
            {showNav ? <ChevronUp className="w-4 h-4 dark:text-dark-muted text-light-muted" /> : <ChevronDown className="w-4 h-4 dark:text-dark-muted text-light-muted" />}
          </button>

          {showNav && (
            <div className="max-h-80 overflow-y-auto">
              {navSteps.map((step, i) => (
                <div key={i} className={`flex items-start gap-3 px-5 py-3 ${i % 2 === 0 ? 'dark:bg-dark-highlight/30 bg-light-highlight' : ''}`}>
                  <span className="text-primary font-mono text-lg flex-shrink-0 w-6 text-center">{maneuverIcon(step.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm dark:text-dark-text text-light-text">{step.instruction}</p>
                    {step.road && <p className="text-xs dark:text-dark-muted text-light-muted">{step.road}</p>}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-semibold stat-number dark:text-dark-text text-light-text">{step.distanceKm?.toFixed(1)} km</p>
                    <p className="text-xs dark:text-dark-muted text-light-muted">{step.durationMin?.toFixed(0)} min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Share Modal */}
      {showShare && trip && <ShareModal tripData={trip} vehicle={vehicle} onClose={() => setShowShare(false)} />}
    </div>
  );
};

export default TripDetailPage;
