const { saveTrip, getUserTrips, getTripById, deleteTrip, getTripStats } = require('../services/tripService');
const { success, error } = require('../utils/responseHelper');

const createTrip = async (req, res) => {
  try {
    const trip = await saveTrip(req.user.userId, req.body);
    return success(res, trip, 'Trip saved', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const getTrips = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await getUserTrips(req.user.userId, parseInt(page), parseInt(limit));
    return success(res, result, 'Trips retrieved');
  } catch (err) {
    return error(res, err.message);
  }
};

const getTrip = async (req, res) => {
  try {
    const trip = await getTripById(req.params.id, req.user.userId);
    if (!trip) return error(res, 'Trip not found', 404);
    return success(res, trip, 'Trip retrieved');
  } catch (err) {
    return error(res, err.message);
  }
};

const removeTrip = async (req, res) => {
  try {
    const trip = await deleteTrip(req.params.id, req.user.userId);
    if (!trip) return error(res, 'Trip not found', 404);
    return success(res, null, 'Trip deleted');
  } catch (err) {
    return error(res, err.message);
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await getTripStats(req.user.userId);
    return success(res, stats, 'Stats retrieved');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { createTrip, getTrips, getTrip, removeTrip, getStats };
