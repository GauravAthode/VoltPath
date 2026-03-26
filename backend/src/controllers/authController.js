const { registerUser, loginUser, googleAuthCallback, googleAuthSuccess, getUserById, updateUserVehicle, FRONTEND_URL } = require('../services/authService');
const { success, error } = require('../utils/responseHelper');

const register = async (req, res) => {
  try {
    let { email, name, password } = req.body || {};

    // Basic type checks
    if (
      typeof email !== "string" ||
      typeof name !== "string" ||
      typeof password !== "string"
    ) {
      return error(res, "Invalid input data", 400);
    }

    // Trim input
    email = email.trim().toLowerCase();
    name = name.trim();
    password = password.trim();

    // Required field check
    if (!email || !name || !password) {
      return error(res, "Email, name and password are required", 400);
    }

    // Length limits
    if (name.length < 2 || name.length > 50) {
      return error(res, "Name must be between 2 and 50 characters", 400);
    }

    if (email.length > 254) {
      return error(res, "Invalid email", 400);
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return error(res, "Invalid email format", 400);
    }

    // Strong password check
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,64}$/;

    if (!passwordRegex.test(password)) {
      return error(
        res,
        "Password must be 8-64 characters and include uppercase, lowercase, number, and special character",
        400
      );
    }

    const result = await registerUser(email, name, password);

    return success(res, result, "Registration successful", 201);
  } catch (err) {
    console.error("Register error:", err);

    // Do not expose internal error details
    if (err.message && err.message.toLowerCase().includes("already")) {
      return error(res, "User already exists", 409);
    }

    return error(res, "Internal server error", 500);
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
