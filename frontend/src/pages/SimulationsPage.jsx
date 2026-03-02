import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Navigation, Battery, Zap, Thermometer, Wind, Activity, AlertTriangle } from 'lucide-react';
import { runWeatherSimulation, runTrafficSimulation, runBatteryDegradation } from '../services/authService';
import { DEFAULT_VEHICLE } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'weather', label: 'Weather Impact', icon: Cloud },
  { id: 'traffic', label: 'Traffic Impact', icon: Navigation },
  { id: 'battery', label: 'Battery Health', icon: Battery },
];

const SimulationsPage = () => {
  const { user } = useAuth();
  const vehicle = user?.defaultVehicle || DEFAULT_VEHICLE;

  const [activeTab, setActiveTab] = useState('weather');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});

  const [weatherForm, setWeatherForm] = useState({ lat: '28.6139', lng: '77.2090', baseEfficiency: vehicle.efficiencyKwhPer100km, totalDistanceKm: 300 });
  const [trafficForm, setTrafficForm] = useState({ lat: '28.6139', lng: '77.2090', baseEfficiency: vehicle.efficiencyKwhPer100km, totalDistanceKm: 300 });
  const [batteryForm, setBatteryForm] = useState({ totalDistanceKm: 400, numberOfChargingStops: 3, fastChargeStops: 2, avgDepthOfDischarge: 60 });

  const handleWeatherSim = async () => {
    setLoading(true);
    try {
      const res = await runWeatherSimulation({
        lat: parseFloat(weatherForm.lat), lng: parseFloat(weatherForm.lng),
        baseEfficiency: parseFloat(weatherForm.baseEfficiency),
        batteryCapacityKwh: vehicle.batteryCapacityKwh,
        totalDistanceKm: parseFloat(weatherForm.totalDistanceKm),
      });
      setResults(p => ({ ...p, weather: res.data.data }));
      toast.success('Weather simulation complete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTrafficSim = async () => {
    setLoading(true);
    try {
      const res = await runTrafficSimulation({
        lat: parseFloat(trafficForm.lat), lng: parseFloat(trafficForm.lng),
        baseEfficiency: parseFloat(trafficForm.baseEfficiency),
        totalDistanceKm: parseFloat(trafficForm.totalDistanceKm),
      });
      setResults(p => ({ ...p, traffic: res.data.data }));
      toast.success('Traffic simulation complete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBatterySim = async () => {
    setLoading(true);
    try {
      const res = await runBatteryDegradation({
        tripData: {
          totalDistanceKm: parseFloat(batteryForm.totalDistanceKm),
          chargingStops: Array.from({ length: batteryForm.numberOfChargingStops }, (_, i) => ({
            chargingPowerKw: i < batteryForm.fastChargeStops ? 100 : 22,
            arrivalSocPct: 100 - batteryForm.avgDepthOfDischarge,
          })),
          vehicle,
        },
      });
      setResults(p => ({ ...p, battery: res.data.data }));
      toast.success('Battery analysis complete');
    } catch (err) {
      toast.error('Battery analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const InputRow = ({ label, value, onChange, type = 'number', unit, min, max, step }) => (
    <div>
      <label className="block text-xs dark:text-dark-muted text-light-muted mb-1">{label}</label>
      <div className="relative">
        <input type={type} value={value} onChange={e => onChange(e.target.value)} min={min} max={max} step={step}
          className="w-full px-3 py-2.5 rounded-xl border dark:border-dark-border border-light-border dark:bg-dark-highlight bg-light-highlight dark:text-dark-text text-light-text text-sm focus:outline-none focus:border-primary transition-all pr-12"
        />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs dark:text-dark-muted text-light-muted">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold dark:text-dark-text text-light-text">Energy Simulations</h2>
        <p className="text-sm dark:text-dark-muted text-light-muted mt-0.5">Analyze how weather, traffic and battery health affect your EV range</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === t.id ? 'bg-primary text-dark-bg' : 'dark:bg-dark-surface bg-white border dark:border-dark-border border-light-border dark:text-dark-muted text-light-muted dark:hover:text-dark-text hover:text-light-text'}`}
            data-testid={`tab-${t.id}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border p-6 space-y-4"
        >
          {/* Weather */}
          {activeTab === 'weather' && (
            <>
              <h3 className="font-bold dark:text-dark-text text-light-text flex items-center gap-2"><Cloud className="w-4 h-4 text-primary" />Weather Impact Settings</h3>
              <div className="grid grid-cols-2 gap-3">
                <InputRow label="Latitude" value={weatherForm.lat} onChange={v => setWeatherForm(p => ({ ...p, lat: v }))} type="text" />
                <InputRow label="Longitude" value={weatherForm.lng} onChange={v => setWeatherForm(p => ({ ...p, lng: v }))} type="text" />
                <InputRow label="Base Efficiency" value={weatherForm.baseEfficiency} onChange={v => setWeatherForm(p => ({ ...p, baseEfficiency: v }))} unit="kWh/100km" min={5} max={50} step={0.5} />
                <InputRow label="Trip Distance" value={weatherForm.totalDistanceKm} onChange={v => setWeatherForm(p => ({ ...p, totalDistanceKm: v }))} unit="km" min={10} max={2000} />
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted">Uses OpenWeatherMap API to fetch live weather conditions at the specified coordinates.</p>
              <button onClick={handleWeatherSim} disabled={loading} className="w-full py-3 volt-btn rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60" data-testid="run-weather-sim-btn">
                {loading ? <LoadingSpinner size="sm" /> : <><Cloud className="w-4 h-4" /> Run Weather Simulation</>}
              </button>
            </>
          )}

          {/* Traffic */}
          {activeTab === 'traffic' && (
            <>
              <h3 className="font-bold dark:text-dark-text text-light-text flex items-center gap-2"><Navigation className="w-4 h-4 text-secondary" />Traffic Impact Settings</h3>
              <div className="grid grid-cols-2 gap-3">
                <InputRow label="Latitude" value={trafficForm.lat} onChange={v => setTrafficForm(p => ({ ...p, lat: v }))} type="text" />
                <InputRow label="Longitude" value={trafficForm.lng} onChange={v => setTrafficForm(p => ({ ...p, lng: v }))} type="text" />
                <InputRow label="Base Efficiency" value={trafficForm.baseEfficiency} onChange={v => setTrafficForm(p => ({ ...p, baseEfficiency: v }))} unit="kWh/100km" min={5} max={50} step={0.5} />
                <InputRow label="Trip Distance" value={trafficForm.totalDistanceKm} onChange={v => setTrafficForm(p => ({ ...p, totalDistanceKm: v }))} unit="km" min={10} max={2000} />
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted">Uses TomTom Traffic Flow API to measure real-time congestion at the coordinates.</p>
              <button onClick={handleTrafficSim} disabled={loading} className="w-full py-3 volt-btn rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60" data-testid="run-traffic-sim-btn">
                {loading ? <LoadingSpinner size="sm" /> : <><Navigation className="w-4 h-4" /> Run Traffic Simulation</>}
              </button>
            </>
          )}

          {/* Battery */}
          {activeTab === 'battery' && (
            <>
              <h3 className="font-bold dark:text-dark-text text-light-text flex items-center gap-2"><Battery className="w-4 h-4 text-emerald-400" />Battery Degradation Estimator</h3>
              <div className="grid grid-cols-2 gap-3">
                <InputRow label="Trip Distance" value={batteryForm.totalDistanceKm} onChange={v => setBatteryForm(p => ({ ...p, totalDistanceKm: parseFloat(v) }))} unit="km" />
                <InputRow label="Total Charge Stops" value={batteryForm.numberOfChargingStops} onChange={v => setBatteryForm(p => ({ ...p, numberOfChargingStops: parseInt(v) }))} min={0} max={20} />
                <InputRow label="DC Fast Charge Stops" value={batteryForm.fastChargeStops} onChange={v => setBatteryForm(p => ({ ...p, fastChargeStops: parseInt(v) }))} min={0} max={20} />
                <InputRow label="Avg Depth of Discharge" value={batteryForm.avgDepthOfDischarge} onChange={v => setBatteryForm(p => ({ ...p, avgDepthOfDischarge: parseFloat(v) }))} unit="%" min={0} max={100} />
              </div>
              <button onClick={handleBatterySim} disabled={loading} className="w-full py-3 volt-btn rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60" data-testid="run-battery-sim-btn">
                {loading ? <LoadingSpinner size="sm" /> : <><Battery className="w-4 h-4" /> Analyze Battery Health</>}
              </button>
            </>
          )}
        </motion.div>

        {/* Results Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="dark:bg-dark-surface bg-white rounded-2xl border dark:border-dark-border border-light-border p-6"
        >
          <h3 className="font-bold dark:text-dark-text text-light-text mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Simulation Results</h3>

          {/* Weather Results */}
          {activeTab === 'weather' && results.weather && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {results.weather.weatherData && (
                <div className="p-4 dark:bg-dark-highlight bg-light-highlight rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-orange-400" />
                    <span className="font-semibold dark:text-dark-text text-light-text text-sm">{results.weather.weatherData.cityName || 'Location'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="dark:text-dark-muted text-light-muted text-xs">Temperature</span><p className="font-bold text-orange-400">{results.weather.weatherData.temp?.toFixed(1)}°C</p></div>
                    <div><span className="dark:text-dark-muted text-light-muted text-xs">Condition</span><p className="font-bold dark:text-dark-text text-light-text capitalize">{results.weather.weatherData.description}</p></div>
                    <div><span className="dark:text-dark-muted text-light-muted text-xs">Wind Speed</span><p className="font-bold dark:text-dark-text text-light-text">{results.weather.weatherData.windSpeed?.toFixed(1)} m/s</p></div>
                    <div><span className="dark:text-dark-muted text-light-muted text-xs">Humidity</span><p className="font-bold dark:text-dark-text text-light-text">{results.weather.weatherData.humidity}%</p></div>
                  </div>
                </div>
              )}
              {results.weather.impact && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm dark:text-dark-muted text-light-muted">Total Impact Factor</span>
                    <span className={`font-bold stat-number ${results.weather.impact.factor > 1.1 ? 'text-orange-400' : 'text-emerald-400'}`}>×{results.weather.impact.factor?.toFixed(3)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm dark:text-dark-muted text-light-muted">Adjusted Efficiency</span>
                    <span className="font-bold text-primary stat-number">{results.weather.impact.adjustedEfficiency?.toFixed(1)} kWh/100km</span>
                  </div>
                  {results.weather.extraEnergyKwh !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm dark:text-dark-muted text-light-muted">Extra Energy for Trip</span>
                      <span className="font-bold text-orange-400 stat-number">+{results.weather.extraEnergyKwh?.toFixed(1)} kWh</span>
                    </div>
                  )}
                  <div className="mt-2 space-y-2">
                    {results.weather.impact.analysis?.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 dark:bg-dark-highlight bg-light-highlight rounded-lg">
                        <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium dark:text-dark-text text-light-text">{a.factor} <span className="text-orange-400">({a.impact})</span></p>
                          <p className="text-xs dark:text-dark-muted text-light-muted">{a.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Traffic Results */}
          {activeTab === 'traffic' && results.traffic && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {results.traffic.impact && (
                <>
                  <div className="text-center p-6 dark:bg-dark-highlight bg-light-highlight rounded-xl">
                    <p className="text-xs dark:text-dark-muted text-light-muted uppercase tracking-wide mb-2">Traffic Level</p>
                    <p className="text-3xl font-black stat-number" style={{ color: { free: '#34D399', light: '#00F0FF', moderate: '#CCFF00', heavy: '#FF9500', congested: '#FF3B30' }[results.traffic.impact.trafficLevel] || '#94A3B8' }}>
                      {results.traffic.impact.levelLabel}
                    </p>
                    <p className="text-sm dark:text-dark-muted text-light-muted mt-1">{results.traffic.impact.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Current Speed', value: `${results.traffic.impact.currentSpeed || '?'} km/h`, color: 'text-primary' },
                      { label: 'Free Flow Speed', value: `${results.traffic.impact.freeFlowSpeed || '?'} km/h`, color: 'text-secondary' },
                      { label: 'Congestion Ratio', value: `${((results.traffic.impact.congestionRatio || 1) * 100).toFixed(0)}%`, color: 'text-emerald-400' },
                      { label: 'Energy Impact', value: `+${results.traffic.impact.impactPct}%`, color: 'text-orange-400' },
                    ].map(item => (
                      <div key={item.label} className="p-3 dark:bg-dark-highlight bg-light-highlight rounded-xl">
                        <p className="text-xs dark:text-dark-muted text-light-muted">{item.label}</p>
                        <p className={`font-bold stat-number ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 dark:bg-dark-highlight bg-light-highlight rounded-xl">
                    <p className="text-xs dark:text-dark-muted text-light-muted mb-1">Adjusted Efficiency</p>
                    <p className="font-bold text-primary stat-number">{results.traffic.impact.adjustedEfficiency?.toFixed(1)} kWh/100km</p>
                    <p className="text-xs dark:text-dark-muted text-light-muted mt-1">+{results.traffic.impact.additionalEnergyKwh?.toFixed(1)} kWh extra for {weatherForm.totalDistanceKm} km trip</p>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Battery Results */}
          {activeTab === 'battery' && results.battery && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="text-center p-6 dark:bg-dark-highlight bg-light-highlight rounded-xl">
                <p className="text-xs dark:text-dark-muted text-light-muted uppercase tracking-wide mb-2">Estimated SoH Impact</p>
                <p className="text-4xl font-black stat-number text-orange-400">-{results.battery.estimatedSohImpactPct?.toFixed(4)}%</p>
                <p className="text-sm dark:text-dark-muted text-light-muted mt-1">Battery State of Health impact</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Fast Charge Stops', value: results.battery.fastChargeStops, color: 'text-orange-400' },
                  { label: 'Avg Depth of Discharge', value: `${results.battery.avgDepthOfDischarge?.toFixed(1)}%`, color: 'text-primary' },
                ].map(item => (
                  <div key={item.label} className="p-3 dark:bg-dark-highlight bg-light-highlight rounded-xl">
                    <p className="text-xs dark:text-dark-muted text-light-muted">{item.label}</p>
                    <p className={`font-bold stat-number ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border border-primary/20 rounded-xl bg-primary/5">
                <p className="text-xs font-medium text-primary mb-1">Recommendation</p>
                <p className="text-sm dark:text-dark-muted text-light-muted">{results.battery.recommendation}</p>
              </div>
            </motion.div>
          )}

          {!results[activeTab] && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="w-12 h-12 dark:text-dark-muted text-light-muted opacity-30 mb-3" />
              <p className="text-sm dark:text-dark-muted text-light-muted">Run a simulation to see results here</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SimulationsPage;
