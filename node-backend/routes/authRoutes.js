const express = require('express');
const controller = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/send-otp', controller.sendOtp);
router.post('/verify-otp', controller.verifyOtp);
router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authenticateToken, controller.getCurrentUser);

module.exports = router;
