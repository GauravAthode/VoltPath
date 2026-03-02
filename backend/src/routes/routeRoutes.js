const express = require('express');
const router = express.Router();
const { calculateRoute, geocode } = require('../controllers/routeController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/calculate', authMiddleware, calculateRoute);
router.get('/geocode', geocode);

module.exports = router;
