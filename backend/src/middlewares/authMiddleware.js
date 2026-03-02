const jwt = require('jsonwebtoken');
const Session = require('../models/vehicleModel');
const User = require('../models/userModel');
const { JWT_SECRET } = require('../config/envConfig');

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Check cookie as fallback
    if (!token && req.cookies?.session_token) {
      const session = await Session.findOne({
        sessionToken: req.cookies.session_token,
        expiresAt: { $gt: new Date() },
      });
      if (session) {
        const user = await User.findOne({ userId: session.userId });
        if (user) {
          req.user = { userId: user.userId, email: user.email, name: user.name };
          return next();
        }
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
