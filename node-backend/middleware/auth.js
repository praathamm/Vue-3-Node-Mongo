const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { normalizeRole } = require('../utils/auth');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, jwtSecret, (error, decoded) => {
    if (error) return res.status(403).json({ message: 'Invalid or expired token' });

    req.user = decoded;
    next();
  });
}

function authorizeRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(normalizeRole(req.user.role))) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    }

    next();
  };
}

module.exports = { authenticateToken, authorizeRole };
