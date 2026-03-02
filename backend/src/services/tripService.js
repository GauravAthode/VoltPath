const { v4: uuidv4 } = require('uuid');
const Trip = require('../models/tripModel');

const saveTrip = async (userId, tripData) => {
  const tripId = `trip_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  return Trip.create({ tripId, userId, ...tripData });
};

const getUserTrips = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [trips, total] = await Promise.all([
    Trip.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Trip.countDocuments({ userId }),
  ]);
  return { trips, total, page, pages: Math.ceil(total / limit) };
};

const getTripById = async (tripId, userId) => {
  return Trip.findOne({ tripId, userId }).lean();
};

const deleteTrip = async (tripId, userId) => {
  return Trip.findOneAndDelete({ tripId, userId });
};

const getTripStats = async (userId) => {
  const trips = await Trip.find({ userId }).lean();
  const totalTrips = trips.length;
  const totalDistanceKm = trips.reduce((s, t) => s + (t.summary?.totalDistanceKm || 0), 0);
  const totalEnergyKwh = trips.reduce((s, t) => s + (t.summary?.totalEnergyKwh || 0), 0);
  const totalCostUsd = trips.reduce((s, t) => s + (t.summary?.totalCostUsd || 0), 0);
  const totalChargingStops = trips.reduce((s, t) => s + (t.summary?.numberOfChargingStops || 0), 0);
  const avgDistanceKm = totalTrips > 0 ? totalDistanceKm / totalTrips : 0;

  return {
    totalTrips,
    totalDistanceKm: parseFloat(totalDistanceKm.toFixed(1)),
    totalEnergyKwh: parseFloat(totalEnergyKwh.toFixed(1)),
    totalCostUsd: parseFloat(totalCostUsd.toFixed(2)),
    totalChargingStops,
    avgDistanceKm: parseFloat(avgDistanceKm.toFixed(1)),
  };
};

module.exports = { saveTrip, getUserTrips, getTripById, deleteTrip, getTripStats };
