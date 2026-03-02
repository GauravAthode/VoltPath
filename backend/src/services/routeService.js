const axios = require('axios');
const { getStationsAlongRoute } = require('./stationService');
const { runRouteSimulation } = require('../utils/energyCalculator');

const OSRM_BASE = 'http://router.project-osrm.org/route/v1/driving';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

const buildNavInstruction = (step) => {
  const { maneuver, name } = step;
  if (!maneuver) return { text: `Continue on ${name || 'road'}`, type: 'straight', modifier: '' };

  const { type, modifier } = maneuver;
  const road = name ? `onto ${name}` : '';
  const modText = {
    'uturn': 'Make a U-turn',
    'sharp right': 'Turn sharp right',
    'right': 'Turn right',
    'slight right': 'Bear right',
    'straight': 'Continue straight',
    'slight left': 'Bear left',
    'left': 'Turn left',
    'sharp left': 'Turn sharp left',
  };

  const instructions = {
    'depart': `Start ${road || 'your journey'}`,
    'arrive': `Arrive at your ${modifier === 'right' ? 'right' : modifier === 'left' ? 'left' : 'destination'}`,
    'turn': `${modText[modifier] || 'Turn'} ${road}`,
    'new name': `Continue ${road}`,
    'merge': `Merge ${modifier || ''} ${road}`,
    'on ramp': `Take the on-ramp ${road}`,
    'off ramp': `Take the exit ${road}`,
    'fork': `Keep ${modifier || 'straight'} at the fork`,
    'end of road': `Turn ${modifier || ''} at end of road`,
    'roundabout': `At the roundabout, take the exit ${road}`,
    'rotary': `At the roundabout, take the exit ${road}`,
    'roundabout turn': `At the roundabout, turn ${modifier || ''} ${road}`,
    'notification': `Continue ${road}`,
  };

  return {
    text: instructions[type] || `${modText[modifier] || 'Continue'} ${road}`,
    type: type || 'straight',
    modifier: modifier || '',
    road: name || '',
  };
};

const extractNavSteps = (legs) => {
  if (!legs || !legs.length) return [];
  const steps = [];
  for (const leg of legs) {
    for (const step of (leg.steps || [])) {
      const instr = buildNavInstruction(step);
      steps.push({
        instruction: instr.text,
        type: instr.type,
        modifier: instr.modifier,
        road: instr.road,
        distanceKm: parseFloat((step.distance / 1000).toFixed(2)),
        durationMin: parseFloat((step.duration / 60).toFixed(1)),
        location: step.maneuver?.location ? {
          lng: step.maneuver.location[0],
          lat: step.maneuver.location[1],
        } : null,
      });
    }
  }
  return steps;
};

const geocodeAddress = async (address) => {
  try {
    const response = await axios.get(NOMINATIM_BASE, {
      params: { q: address, format: 'json', limit: 1, addressdetails: 1 },
      headers: { 'User-Agent': 'VoltPath/1.0 (ev-route-planner)' },
      timeout: 5000,
    });

    if (!response.data.length) throw new Error(`Could not geocode: ${address}`);
    const r = response.data[0];
    return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), displayName: r.display_name };
  } catch (err) {
    console.error('Geocoding error:', err.message);
    throw err;
  }
};

const getRoute = async (originCoords, destCoords) => {
  try {
    const coordStr = `${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}`;
    const response = await axios.get(`${OSRM_BASE}/${coordStr}`, {
      params: { overview: 'full', geometries: 'geojson', steps: true, annotations: false },
      timeout: 10000,
    });

    if (!response.data.routes?.length) throw new Error('No route found');
    const route = response.data.routes[0];

    const distanceKm = route.distance / 1000;
    const durationMin = route.duration / 60;
    const coordinates = route.geometry.coordinates;

    // Sample waypoints for charging station search (every ~50 km)
    const waypointStep = Math.max(1, Math.floor(coordinates.length / 20));
    const waypoints = coordinates.filter((_, i) => i % waypointStep === 0).map(([lng, lat]) => ({ lat, lng }));

    // Create segments (split route into ~50km chunks)
    const segmentCount = Math.max(1, Math.ceil(distanceKm / 50));
    const segmentDist = distanceKm / segmentCount;
    const segments = Array.from({ length: segmentCount }, (_, i) => ({
      from: i === 0 ? 'Origin' : `Waypoint ${i}`,
      to: i === segmentCount - 1 ? 'Destination' : `Waypoint ${i + 1}`,
      distanceKm: segmentDist,
      startPoint: waypoints[Math.floor((i / segmentCount) * waypoints.length)] || waypoints[0],
    }));

    return { distanceKm, durationMin, geometry: route.geometry, waypoints, segments, legs: route.legs, navSteps: extractNavSteps(route.legs) };
  } catch (err) {
    console.error('OSRM routing error:', err.message);
    throw err;
  }
};

const getMultiStopRoute = async (coordStr, numPoints) => {
  try {
    const response = await axios.get(`${OSRM_BASE}/${coordStr}`, {
      params: { overview: 'full', geometries: 'geojson', steps: true, annotations: false },
      timeout: 15000,
    });

    if (!response.data.routes?.length) throw new Error('No route found');
    const route = response.data.routes[0];

    const distanceKm = route.distance / 1000;
    const durationMin = route.duration / 60;
    const coordinates = route.geometry.coordinates;

    const waypointStep = Math.max(1, Math.floor(coordinates.length / 20));
    const waypoints = coordinates.filter((_, i) => i % waypointStep === 0).map(([lng, lat]) => ({ lat, lng }));

    const segmentCount = Math.max(1, Math.ceil(distanceKm / 50));
    const segmentDist = distanceKm / segmentCount;
    const segments = Array.from({ length: segmentCount }, (_, i) => ({
      from: i === 0 ? 'Origin' : `Stop ${i}`,
      to: i === segmentCount - 1 ? 'Destination' : `Stop ${i + 1}`,
      distanceKm: segmentDist,
      startPoint: waypoints[Math.floor((i / segmentCount) * waypoints.length)] || waypoints[0],
    }));

    return { distanceKm, durationMin, geometry: route.geometry, waypoints, segments, legs: route.legs, navSteps: extractNavSteps(route.legs) };
  } catch (err) {
    console.error('OSRM multi-stop routing error:', err.message);
    throw err;
  }
};

const planRoute = async (originAddress, destAddress, vehicle, waypointAddresses = []) => {
  // Geocode all points in parallel
  const allAddresses = [originAddress, ...waypointAddresses.filter(Boolean), destAddress];
  const allCoords = await Promise.all(allAddresses.map(addr => geocodeAddress(addr)));

  const originCoords = allCoords[0];
  const destCoords = allCoords[allCoords.length - 1];
  const waypointCoords = allCoords.slice(1, -1);

  // Build OSRM coord string with all waypoints
  const coordStr = allCoords.map(c => `${c.lng},${c.lat}`).join(';');

  let routeData;
  if (allCoords.length === 2) {
    routeData = await getRoute(originCoords, destCoords);
  } else {
    routeData = await getMultiStopRoute(coordStr, allCoords.length);
  }

  // Fetch charging stations along route
  const sampleWaypoints = routeData.waypoints.filter((_, i) => i % 3 === 0).slice(0, 10);
  const stations = await getStationsAlongRoute(sampleWaypoints, 8);

  // Run energy simulation
  const simulation = runRouteSimulation(vehicle, routeData.segments, stations);

  const drivingTimeMin = routeData.durationMin;
  const totalTripTimeMin = drivingTimeMin + simulation.totalChargingTimeMin;

  return {
    origin: { address: originAddress, ...originCoords },
    destination: { address: destAddress, ...destCoords },
    intermediateStops: waypointAddresses.filter(Boolean).map((addr, i) => ({ address: addr, ...waypointCoords[i] })),
    routeGeometry: routeData.geometry,
    waypoints: routeData.waypoints,
    segments: simulation.segmentResults,
    chargingStops: simulation.chargingStops,
    stationsAlongRoute: stations.slice(0, 30),
    navSteps: routeData.navSteps,
    summary: {
      totalDistanceKm: parseFloat(routeData.distanceKm.toFixed(2)),
      totalDrivingTimeMin: parseFloat(drivingTimeMin.toFixed(0)),
      totalChargingTimeMin: simulation.totalChargingTimeMin,
      totalTripTimeMin: parseFloat(totalTripTimeMin.toFixed(0)),
      totalEnergyKwh: simulation.totalEnergyKwh,
      totalCostInr: simulation.totalChargingCostUsd,
      initialSocPct: vehicle.usableBatteryPct,
      finalSocPct: simulation.finalSocPct,
      numberOfChargingStops: simulation.chargingStops.length,
    },
  };
};

module.exports = { geocodeAddress, getRoute, getMultiStopRoute, planRoute };
