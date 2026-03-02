const crypto = require('crypto');
const Share = require('../models/shareModel');
const { success, error } = require('../utils/responseHelper');

// POST /api/share — create share link (auth required)
const createShare = async (req, res) => {
  try {
    const { tripData, vehicle, expiryDays = 1 } = req.body;
    if (!tripData) return error(res, 'Trip data is required', 400);

    const token = crypto.randomBytes(10).toString('hex'); // 20-char token
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const share = await Share.create({
      token,
      tripData,
      vehicle,
      createdBy: req.user?.id,
      expiresAt,
    });

    return success(res, { token, expiresAt, shareUrl: `/share/${token}` }, 'Share link created');
  } catch (err) {
    return error(res, `Failed to create share: ${err.message}`, 500);
  }
};

// GET /api/share/:token — public access (no auth)
const getShare = async (req, res) => {
  try {
    const share = await Share.findOne({ token: req.params.token });
    if (!share) return error(res, 'Share link not found or expired', 404);
    if (share.expiresAt < new Date()) return error(res, 'Share link has expired', 410);

    // Increment view count
    await Share.findByIdAndUpdate(share._id, { $inc: { viewCount: 1 } });

    return success(res, {
      tripData: share.tripData,
      vehicle: share.vehicle,
      token: share.token,
      expiresAt: share.expiresAt,
      viewCount: share.viewCount + 1,
      createdAt: share.createdAt,
    }, 'Share retrieved');
  } catch (err) {
    return error(res, `Failed to retrieve share: ${err.message}`, 500);
  }
};

module.exports = { createShare, getShare };
