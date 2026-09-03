const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase().replace(/\s+/g, '_');

  if (value === 'admin' || value === 'courier_staff' || value === 'courierstaff' || value === 'courier-staff') {
    return 'courier_staff';
  }

  return 'customer';
}

function roleLabel(role) {
  return normalizeRole(role) === 'courier_staff' ? 'Courier Staff' : 'Customer';
}

function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: normalizeRole(user.role),
      name: user.name,
      phoneNumber: user.phoneNumber || '',
    },
    jwtSecret
  );
}

module.exports = { normalizeRole, roleLabel, generateToken };
