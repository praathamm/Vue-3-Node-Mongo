module.exports = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-key',
  otpResendCooldownMs: 60 * 1000,
};
