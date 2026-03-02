const axios = require('axios');
const { OPEN_CHARGE_MAP_API_KEY } = require('../config/envConfig');

const BASE_URL = 'https://api.openchargemap.io/v3/poi/';

const getNearbyStations = async (lat, lng, distanceKm = 10, maxResults = 20) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        output: 'json',
        latitude: lat,
        longitude: lng,
        distance: distanceKm,
        distanceunit: 'km',
        maxresults: maxResults,
        compact: true,
        verbose: false,
        key: OPEN_CHARGE_MAP_API_KEY,
      },
      timeout: 8000,
    });

    return response.data.map(formatStation);
  } catch (err) {
    console.error('OCM API error:', err.message);
    return [];
  }
};

const getStationsAlongRoute = async (waypoints, distanceKm = 5) => {
  const allStations = [];
  const seen = new Set();

  for (const wp of waypoints) {
    const stations = await getNearbyStations(wp.lat, wp.lng, distanceKm, 10);
    for (const s of stations) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        allStations.push(s);
      }
    }
  }
  return allStations;
};

const formatStation = (raw) => {
  const info = raw.AddressInfo || {};
  const connections = raw.Connections || [];
  const maxPower = connections.reduce((max, c) => Math.max(max, c.PowerKW || 0), 0);
  const connectorTypes = [...new Set(connections.map(c => c.ConnectionType?.Title || 'Unknown').filter(Boolean))];

  return {
    id: String(raw.ID),
    name: info.Title || 'Charging Station',
    address: [info.AddressLine1, info.Town, info.Country?.Title].filter(Boolean).join(', '),
    location: { lat: info.Latitude, lng: info.Longitude },
    maxPowerKw: maxPower,
    connectorTypes,
    numberOfPoints: raw.NumberOfPoints || connections.length,
    operatorName: raw.OperatorInfo?.Title || 'Unknown Operator',
    statusType: raw.StatusType?.Title || 'Unknown',
    isOperational: raw.StatusType?.IsOperational !== false,
    usageCost: raw.UsageCost || null,
    lastVerified: raw.DateLastVerified,
  };
};

module.exports = { getNearbyStations, getStationsAlongRoute, formatStation };
