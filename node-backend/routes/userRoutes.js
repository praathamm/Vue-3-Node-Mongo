const express = require('express');
const controller = require('../controllers/authController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.get('/users', authenticateToken, authorizeRole(['courier_staff']), controller.listUsers);

module.exports = router;
