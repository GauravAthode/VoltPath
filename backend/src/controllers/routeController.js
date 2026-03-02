const { planRoute, geocodeAddress } = require('../services/routeService');
const { success, error } = require('../utils/responseHelper');

const calculateRoute = async (req, res) => {
  try {
    const { origin, destination, waypoints = [], vehicle } = req.body;
    if (!origin || !destination) return error(res, 'Origin and destination are required', 400);
    if (!vehicle) return error(res, 'Vehicle parameters are required', 400);

    const result = await planRoute(origin, destination, vehicle, waypoints);
    return success(res, result, 'Route calculated successfully');
  } catch (err) {
    return error(res, `Route calculation failed: ${err.message}`, 500);
  }
};

const geocode = async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return error(res, 'Address is required', 400);
    const result = await geocodeAddress(address);
    return success(res, result, 'Geocoding successful');
  } catch (err) {
    return error(res, err.message, 404);
  }
};

module.exports = { calculateRoute, geocode };
