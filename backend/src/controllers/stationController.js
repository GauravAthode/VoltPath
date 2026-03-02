const { getNearbyStations } = require('../services/stationService');
const { success, error } = require('../utils/responseHelper');

const getStations = async (req, res) => {
  try {
    const { lat, lng, distance = 15, maxResults = 30 } = req.query;
    if (!lat || !lng) return error(res, 'lat and lng are required', 400);
    const stations = await getNearbyStations(parseFloat(lat), parseFloat(lng), parseFloat(distance), parseInt(maxResults));
    return success(res, stations, 'Stations retrieved');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getStations };
