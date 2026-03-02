const express = require('express');
const router = express.Router();
const { getStations } = require('../controllers/stationController');

router.get('/', getStations);

module.exports = router;
