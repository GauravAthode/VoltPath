const { registerUser, loginUser, googleAuthCallback, googleAuthSuccess, getUserById, updateUserVehicle, FRONTEND_URL } = require('../services/authService');
const { success, error } = require('../utils/responseHelper');

const register = async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) return error(res, 'Email, name and password are required', 400);
    if (password.length < 6) return error(res, 'Password must be at least 6 characters', 400);
    const result = await registerUser(email, name, password);
    return success(res, result, 'Registration successful', 201);
  } catch (err) {
    return error(res, err.message, err.message.includes('already') ? 409 : 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password are required', 400);
    const result = await loginUser(email, password);
    return success(res, result, 'Login successful');
  } catch (err) {
    return error(res, err.message, 401);
  }
};

// Google OAuth - Redirect to Google
const googleAuth = (req, res) => {
  // This is handled by passport in the route
};

// Google OAuth Callback - After Google redirects back
const googleCallback = async (req, res) => {
  try {
   
    const user = req.user;
    
    if (!user) {
      
      return res.redirect(`${FRONTEND_URL}/?auth_error=no_user`);
    }
    
    const result = await googleAuthSuccess(user);
    console.log('Google callback - Generated token, redirecting to frontend');
    
    // Redirect to frontend with token
    const redirectUrl = `${FRONTEND_URL}/auth/callback?token=${result.token}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
  
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('Google callback error:', err);
    res.redirect(`${FRONTEND_URL}/?auth_error=google_failed`);
  }
};

const googleSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return error(res, 'Session ID is required', 400);
    const result = await googleAuthCallback(sessionId);

    res.cookie('session_token', result.sessionToken, {
      httpOnly: true, secure: true, sameSite: 'none',
      path: '/', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(res, { token: result.token, user: result.user }, 'Google authentication successful');
  } catch (err) {
    return error(res, `Google auth failed: ${err.message}`, 401);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) return error(res, 'User not found', 404);
    const { passwordHash, __v, _id, ...cleanUser } = user.toObject ? user.toObject() : user;
    return success(res, cleanUser, 'User profile retrieved');
  } catch (err) {
    return error(res, err.message);
  }
};

const updateVehicle = async (req, res) => {
  try {
    const user = await updateUserVehicle(req.user.userId, req.body);
    if (!user) return error(res, 'User not found', 404);
    return success(res, user.defaultVehicle, 'Vehicle settings updated');
  } catch (err) {
    return error(res, err.message);
  }
};

const logout = async (req, res) => {
  res.clearCookie('session_token', { path: '/', sameSite: 'none', secure: true });
  return success(res, null, 'Logged out successfully');
};

module.exports = { register, login, googleAuth, googleCallback, googleSession, getMe, updateVehicle, logout };
