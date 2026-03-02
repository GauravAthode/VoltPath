import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, Zap, Filter, Loader } from 'lucide-react';
import { getNearbyStations } from '../services/authService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' });

const stationIcon = (power) => new L.DivIcon({
  html: `<div style="background:${power >= 50 ? '#00F0FF' : power >= 22 ? '#CCFF00' : '#94A3B8'};width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #0B0E14;box-shadow:0 0 6px rgba(0,240,255,0.5)">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#0B0E14"><path d="M13 2L4.5 13.5H11L11 22 19.5 10.5H13L13 2Z"/></svg></div>`,
  className: '', iconSize: [24, 24], iconAnchor: [12, 12],
});

const ChargingStationsPage = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [coords, setCoords] = useState({ lat: 28.6139, lng: 77.2090 });
  const [selectedStation, setSelectedStation] = useState(null);
  const [distance, setDistance] = useState(15);

  const fetchStations = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const res = await getNearbyStations({ lat, lng, distance, maxResults: 40 });
      setStations(res.data.data);
      if (res.data.data.length === 0) toast('No stations found in this area', { icon: '📍' });
    } catch (err) {
      toast.error('Failed to fetch charging stations');
    } finally {
      setLoading(false);
    }
  }, [distance]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });
          fetchStations(latitude, longitude);
        },
        () => fetchStations(coords.lat, coords.lng)
      );
    } else {
      fetchStations(coords.lat, coords.lng);
    }
  }, []);

  const handleSearch = async () => {
    if (!searchLocation.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchLocation)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'VoltPath/1.0' },
      });
      const data = await res.json();
      if (data.length) {
        const { lat, lon } = data[0];
        const newCoords = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setCoords(newCoords);
        fetchStations(newCoords.lat, newCoords.lng);
      } else {
        toast.error('Location not found');
      }
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const getStationBadge = (power) => {
    if (power >= 100) return { label: 'Ultra-Fast', color: 'text-primary bg-primary/10' };
    if (power >= 50) return { label: 'DC Fast', color: 'text-secondary bg-secondary/10' };
    if (power >= 22) return { label: 'AC Fast', color: 'text-emerald-400 bg-emerald-400/10' };
    return { label: 'Slow AC', color: 'text-light-muted bg-light-muted/10' };
  };

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold dark:text-dark-text text-light-text">Charging Stations</h2>
          <p className="text-sm dark:text-dark-muted text-light-muted">{stations.length} stations found</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <input
              type="text" value={searchLocation} onChange={e => setSearchLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search city or address..."
              className="px-3 py-2 rounded-xl border dark:border-dark-border border-light-border dark:bg-dark-surface bg-white dark:text-dark-text text-light-text text-sm focus:outline-none focus:border-primary w-52"
              data-testid="station-search-input"
            />
            <button onClick={handleSearch} disabled={loading} className="w-9 h-9 volt-btn rounded-xl flex items-center justify-center flex-shrink-0" data-testid="station-search-btn">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
          <select
            value={distance} onChange={e => setDistance(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border dark:border-dark-border border-light-border dark:bg-dark-surface bg-white dark:text-dark-text text-light-text text-sm"
            data-testid="distance-select"
          >
            {[5, 10, 15, 25, 50].map(d => <option key={d} value={d}>{d} km</option>)}
          </select>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Map */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 rounded-2xl overflow-hidden border dark:border-dark-border border-light-border" style={{ minHeight: '400px' }}>
          <MapContainer center={[coords.lat, coords.lng]} zoom={11} className="w-full h-full" style={{ minHeight: '400px', background: '#0B0E14' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="OpenStreetMap" />
            <Circle center={[coords.lat, coords.lng]} radius={distance * 1000} color="#00F0FF" fillOpacity={0.04} weight={1} />
            {stations.map((s) => s.location?.lat && (
              <Marker key={s.id} position={[s.location.lat, s.location.lng]} icon={stationIcon(s.maxPowerKw || 0)}
                eventHandlers={{ click: () => setSelectedStation(s) }}
              >
                <Popup className="custom-popup">
                  <div className="text-sm min-w-[180px]">
                    <p className="font-bold text-primary mb-1">{s.name}</p>
                    <p className="text-xs opacity-70 mb-2">{s.address}</p>
                    <div className="space-y-1">
                      <p><span className="opacity-60">Power:</span> <strong>{s.maxPowerKw || '?'} kW</strong></p>
                      <p><span className="opacity-60">Points:</span> <strong>{s.numberOfPoints}</strong></p>
                      <p><span className="opacity-60">Operator:</span> {s.operatorName}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </motion.div>

        {/* Station List */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border overflow-hidden flex flex-col">
          <div className="p-4 border-b dark:border-dark-border border-light-border">
            <h3 className="font-bold dark:text-dark-text text-light-text text-sm">Nearby Stations</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12"><LoadingSpinner text="Loading stations..." /></div>
            ) : stations.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-10 h-10 dark:text-dark-muted text-light-muted mx-auto mb-2 opacity-40" />
                <p className="text-sm dark:text-dark-muted text-light-muted">No stations found</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-dark-border divide-light-border">
                {stations.map((s) => {
                  const badge = getStationBadge(s.maxPowerKw);
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedStation(s)}
                      className={`p-4 cursor-pointer transition-colors hover:dark:bg-dark-highlight hover:bg-light-highlight ${selectedStation?.id === s.id ? 'dark:bg-dark-highlight bg-light-highlight border-l-2 border-primary' : ''}`}
                      data-testid="station-list-item"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold dark:text-dark-text text-light-text truncate">{s.name}</p>
                          <p className="text-xs dark:text-dark-muted text-light-muted truncate mt-0.5">{s.address}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${badge.color}`}>{badge.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs dark:text-dark-muted text-light-muted">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" />{s.maxPowerKw || '?'} kW</span>
                        <span>{s.numberOfPoints} point{s.numberOfPoints !== 1 ? 's' : ''}</span>
                        {s.isOperational && <span className="text-emerald-400">Operational</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChargingStationsPage;
