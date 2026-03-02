const evVehicles = require('../data/evVehicles');
const { success, error } = require('../utils/responseHelper');

const getAllVehicles = (req, res) => {
  const { brand, segment, search } = req.query;
  let filtered = [...evVehicles];

  if (brand) filtered = filtered.filter(v => v.brand.toLowerCase() === brand.toLowerCase());
  if (segment) filtered = filtered.filter(v => v.segment.toLowerCase() === segment.toLowerCase());
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.segment.toLowerCase().includes(q)
    );
  }

  const brands = [...new Set(evVehicles.map(v => v.brand))];
  const segments = [...new Set(evVehicles.map(v => v.segment))];

  return success(res, { vehicles: filtered, total: filtered.length, brands, segments }, 'Vehicles retrieved');
};

const getVehicleById = (req, res) => {
  const vehicle = evVehicles.find(v => v.id === req.params.id);
  if (!vehicle) return error(res, 'Vehicle not found', 404);
  return success(res, vehicle, 'Vehicle retrieved');
};

module.exports = { getAllVehicles, getVehicleById };
