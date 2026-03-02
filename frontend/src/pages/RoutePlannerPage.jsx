import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, Zap, Battery, MapPin, Settings, Search, ChevronDown, ChevronUp, Info, Car, Plus, X } from 'lucide-react';
import { calculateRoute } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_VEHICLE } from '../config/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const InputField = ({ label, name, value, onChange, type = 'text', placeholder, min, max, step, unit, tooltip }) => (
  <div>
    <div className="flex items-center gap-1.5 mb-1.5">
      <label className="text-xs font-medium dark:text-dark-muted text-light-muted uppercase tracking-wide">{label}</label>
      {tooltip && <Info className="w-3 h-3 dark:text-dark-muted text-light-muted" title={tooltip} />}
    </div>
    <div className="relative">
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} min={min} max={max} step={step}
        className="w-full px-4 py-2.5 rounded-xl border dark:border-dark-border border-light-border dark:bg-dark-highlight bg-light-highlight dark:text-dark-text text-light-text text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all pr-12"
        data-testid={`input-${name}`}
      />
      {unit && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs dark:text-dark-muted text-light-muted font-mono">{unit}</span>
      )}
    </div>
  </div>
);

const RoutePlannerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Accept vehicle pre-filled from VehicleLibrary
  const prefilledVehicle = location.state?.vehicle;
  const vehicle = prefilledVehicle || user?.defaultVehicle || DEFAULT_VEHICLE;

  const [form, setForm] = useState({
    origin: '',
    destination: '',
    batteryCapacityKwh: vehicle.batteryCapacityKwh,
    usableBatteryPct: vehicle.usableBatteryPct,
    efficiencyKwhPer100km: vehicle.efficiencyKwhPer100km,
    minReserveSocPct: vehicle.minReserveSocPct,
    targetChargeSocPct: vehicle.targetChargeSocPct,
    chargingPowerKw: vehicle.chargingPowerKw,
    electricityRatePerKwh: vehicle.electricityRatePerKwh,
  });

  const [waypoints, setWaypoints] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }));

  const addWaypoint = () => { if (waypoints.length < 3) setWaypoints(p => [...p, '']); };
  const removeWaypoint = (i) => setWaypoints(p => p.filter((_, idx) => idx !== i));
  const updateWaypoint = (i, val) => setWaypoints(p => { const n = [...p]; n[i] = val; return n; });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.origin.trim() || !form.destination.trim()) {
      toast.error('Please enter both origin and destination');
      return;
    }
    setLoading(true);
    try {
      const vehicleParams = {
        name: vehicle.name || 'My EV',
        batteryCapacityKwh: form.batteryCapacityKwh,
        usableBatteryPct: form.usableBatteryPct,
        efficiencyKwhPer100km: form.efficiencyKwhPer100km,
        minReserveSocPct: form.minReserveSocPct,
        targetChargeSocPct: form.targetChargeSocPct,
        chargingPowerKw: form.chargingPowerKw,
        electricityRatePerKwh: form.electricityRatePerKwh,
      };
      const filledWaypoints = waypoints.filter(w => w.trim());
      const res = await calculateRoute({ origin: form.origin, destination: form.destination, waypoints: filledWaypoints, vehicle: vehicleParams });
      navigate('/trip-results', { state: { tripData: res.data.data, vehicle: vehicleParams } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to calculate route. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const quickRoutes = [
    { from: 'Delhi, India', to: 'Agra, India' },
    { from: 'Mumbai, India', to: 'Pune, India' },
    { from: 'Bengaluru, India', to: 'Chennai, India' },
    { from: 'Hyderabad, India', to: 'Vijayawada, India' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold dark:text-dark-text text-light-text">Plan Your EV Route</h2>
        <p className="text-sm dark:text-dark-muted text-light-muted mt-0.5">Enter your trip details and get an optimized charging plan</p>
      </motion.div>

      {/* Quick Routes */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium dark:text-dark-muted text-light-muted uppercase tracking-wider">Quick Routes</p>
          <button onClick={() => navigate('/vehicles')} className="flex items-center gap-1.5 text-xs text-primary hover:underline" data-testid="choose-vehicle-btn">
            <Car className="w-3.5 h-3.5" /> Change Vehicle ({vehicle.name})
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickRoutes.map((r) => (
            <button
              key={r.from}
              onClick={() => setForm(p => ({ ...p, origin: r.from, destination: r.to }))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border dark:border-dark-border border-light-border dark:text-dark-muted text-light-muted dark:hover:border-primary/50 hover:border-primary/50 hover:text-primary transition-all"
              data-testid="quick-route-btn"
            >
              <Route className="w-3 h-3" />
              {r.from.split(',')[0]} → {r.to.split(',')[0]}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit}
        className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border p-6 space-y-6"
        data-testid="route-planner-form"
      >
        {/* Route */}
        <div>
          <h3 className="flex items-center gap-2 font-semibold dark:text-dark-text text-light-text mb-4 text-sm uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-primary" /> Route Details
          </h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-xs font-medium dark:text-dark-muted text-light-muted uppercase tracking-wide mb-1.5">Starting Point</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-dark-muted text-light-muted" />
                <input
                  type="text" name="origin" value={form.origin} onChange={handleChange}
                  placeholder="e.g. Bhopal, Madhya Pradesh"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border dark:border-dark-border border-light-border dark:bg-dark-highlight bg-light-highlight dark:text-dark-text text-light-text text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  data-testid="origin-input"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium dark:text-dark-muted text-light-muted uppercase tracking-wide mb-1.5">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input
                  type="text" name="destination" value={form.destination} onChange={handleChange}
                  placeholder="e.g. Mumbai, Maharashtra"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border dark:border-dark-border border-light-border dark:bg-dark-highlight bg-light-highlight dark:text-dark-text text-light-text text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  data-testid="destination-input"
                  required
                />
              </div>
            </div>

            {/* Waypoints */}
            <AnimatePresence>
              {waypoints.map((wp, i) => (
                <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <label className="block text-xs font-medium dark:text-dark-muted text-light-muted uppercase tracking-wide mb-1.5">
                    Stop {i + 1}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                      type="text" value={wp} onChange={e => updateWaypoint(i, e.target.value)}
                      placeholder={`e.g. Mathura, India`}
                      className="w-full pl-10 pr-10 py-3 rounded-xl border dark:border-dark-border border-light-border dark:bg-dark-highlight bg-light-highlight dark:text-dark-text text-light-text text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
                      data-testid={`waypoint-input-${i}`}
                    />
                    <button type="button" onClick={() => removeWaypoint(i)} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {waypoints.length < 3 && (
              <button type="button" onClick={addWaypoint}
                className="flex items-center gap-2 text-xs text-secondary hover:underline py-1"
                data-testid="add-waypoint-btn"
              >
                <Plus className="w-3.5 h-3.5" /> Add Intermediate Stop ({3 - waypoints.length} remaining)
              </button>
            )}
          </div>
        </div>

        {/* Battery Settings */}
        <div>
          <h3 className="flex items-center gap-2 font-semibold dark:text-dark-text text-light-text mb-4 text-sm uppercase tracking-wider">
            <Battery className="w-4 h-4 text-secondary" /> Battery Settings
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Battery Capacity" name="batteryCapacityKwh" value={form.batteryCapacityKwh} onChange={handleChange} type="number" min={10} max={200} step={1} unit="kWh" tooltip="Total battery pack capacity" />
            <InputField label="Usable Battery" name="usableBatteryPct" value={form.usableBatteryPct} onChange={handleChange} type="number" min={50} max={100} step={1} unit="%" tooltip="Percentage available for use" />
            <InputField label="Energy Efficiency" name="efficiencyKwhPer100km" value={form.efficiencyKwhPer100km} onChange={handleChange} type="number" min={5} max={50} step={0.5} unit="kWh/100km" />
            <InputField label="Min Reserve SoC" name="minReserveSocPct" value={form.minReserveSocPct} onChange={handleChange} type="number" min={5} max={30} step={1} unit="%" tooltip="Safety buffer at destination" />
          </div>
        </div>

        {/* Advanced */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
            data-testid="toggle-advanced-btn"
          >
            <Settings className="w-4 h-4" />
            Advanced Charging Settings
            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 grid grid-cols-2 gap-4"
            >
              <InputField label="Target Charge SoC" name="targetChargeSocPct" value={form.targetChargeSocPct} onChange={handleChange} type="number" min={50} max={100} step={5} unit="%" tooltip="Target SoC at charging stops" />
              <InputField label="Max Charging Power" name="chargingPowerKw" value={form.chargingPowerKw} onChange={handleChange} type="number" min={7} max={350} step={1} unit="kW" />
              <InputField label="Electricity Rate" name="electricityRatePerKwh" value={form.electricityRatePerKwh} onChange={handleChange} type="number" min={1} max={50} step={0.5} unit="₹/kWh" />
            </motion.div>
          )}
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full py-4 rounded-xl volt-btn font-bold text-sm flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
          data-testid="calculate-route-btn"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Calculating Optimal Route...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Calculate EV Route
              <Route className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </motion.form>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-start gap-3 p-4 dark:bg-primary/5 bg-primary/5 rounded-xl border border-primary/20"
      >
        <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs dark:text-dark-muted text-light-muted">
          VoltPath uses real charging station data from Open Charge Map, OpenWeatherMap for weather conditions, and TomTom Traffic for real-time congestion. Route calculation typically takes under 10 seconds.
        </p>
      </motion.div>
    </div>
  );
};

export default RoutePlannerPage;
