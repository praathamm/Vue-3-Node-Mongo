const authService = require('../services/authService');
const { sendControllerError } = require('../utils/errors');

async function sendOtp(req, res) {
  try {
    const result = await authService.sendOtp(req.body.email);
    return res.json(result);
  } catch (error) {
    if (error.retryAfterSeconds) {
      return res.status(error.status || 429).json({ message: error.message, retryAfterSeconds: error.retryAfterSeconds });
    }
    return sendControllerError(res, 'Send OTP error', error, 'Error sending OTP.');
  }
}

async function verifyOtp(req, res) {
  try {
    return res.json(await authService.verifyOtp(req.body.email, req.body.otp));
  } catch (error) {
    return sendControllerError(res, 'Verify OTP error', error, 'Error verifying OTP.');
  }
}

async function register(req, res) {
  try {
    return res.status(201).json(await authService.register(req.body));
  } catch (error) {
    return sendControllerError(res, 'Registration error', error, 'Error creating account.');
  }
}

async function login(req, res) {
  try {
    return res.json(await authService.login(req.body));
  } catch (error) {
    return sendControllerError(res, 'Login error', error, 'Error during login.');
  }
}

async function getCurrentUser(req, res) {
  try {
    return res.json(await authService.getCurrentUser(req.user.userId));
  } catch (error) {
    return sendControllerError(res, 'Get me error', error, 'Error fetching user details.');
  }
}

async function listUsers(req, res) {
  try {
    return res.json(await authService.listUsers());
  } catch (error) {
    return sendControllerError(res, 'Get users error', error, 'Error fetching users.');
  }
}

module.exports = { sendOtp, verifyOtp, register, login, getCurrentUser, listUsers };
