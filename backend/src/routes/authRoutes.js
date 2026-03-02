const express = require('express');
const router = express.Router();
const passport = require('passport');
const { register, login, googleSession, getMe, updateVehicle, logout, googleAuth, googleCallback } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/?auth_error=google_failed' }),
  googleCallback
);

// Legacy session-based Google auth (for Emergent AI compatibility)
router.post('/google/session', googleSession);

router.get('/me', authMiddleware, getMe);
router.put('/vehicle', authMiddleware, updateVehicle);
router.post('/logout', authMiddleware, logout);

module.exports = router;
