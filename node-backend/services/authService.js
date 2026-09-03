const bcrypt = require('bcryptjs');
const { generateOtp, sendOtpEmail } = require('../otpService');
const { getCollections } = require('../config/database');
const { otpResendCooldownMs } = require('../config');
const { normalizeRole, roleLabel, generateToken } = require('../utils/auth');
const { httpError } = require('../utils/errors');

async function sendOtp(email) {
  if (!email) throw httpError(400, 'Email is required.');

  const { otpVerifications } = getCollections();
  const normalizedEmail = email.toLowerCase();
  const existingRecord = await otpVerifications.findOne({ email: normalizedEmail });

  if (existingRecord?.lastSentAt && Date.now() - existingRecord.lastSentAt.getTime() < otpResendCooldownMs) {
    const retryAfterSeconds = Math.ceil(
      (otpResendCooldownMs - (Date.now() - existingRecord.lastSentAt.getTime())) / 1000
    );
    const error = httpError(429, `Please wait ${retryAfterSeconds} seconds before requesting another OTP.`);
    error.retryAfterSeconds = retryAfterSeconds;
    throw error;
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);

  await otpVerifications.updateOne(
    { email: normalizedEmail },
    {
      $set: {
        email: normalizedEmail,
        hashedOtp,
        verified: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        lastSentAt: new Date(),
      },
    },
    { upsert: true }
  );

  await sendOtpEmail(normalizedEmail, otp);
  return { message: 'OTP sent successfully.' };
}

async function verifyOtp(email, otp) {
  if (!email || !otp) throw httpError(400, 'Email and OTP are required.');

  const { otpVerifications } = getCollections();
  const normalizedEmail = email.toLowerCase();
  const record = await otpVerifications.findOne({ email: normalizedEmail });

  if (!record || record.expiresAt < new Date()) {
    throw httpError(400, 'OTP expired or not found. Please request a new one.');
  }

  if (!(await bcrypt.compare(otp, record.hashedOtp))) throw httpError(400, 'Incorrect OTP.');

  await otpVerifications.updateOne({ email: normalizedEmail }, { $set: { verified: true } });
  return { message: 'Email verified successfully.' };
}

async function register({ name, email, phoneNumber, password, role }) {
  if (!name || !email || !phoneNumber || !password) {
    throw httpError(400, 'Name, email, phone number and password are required.');
  }

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!validEmail.test(email)) throw httpError(400, 'Please provide a valid email address.');
  if (!/^\d{10}$/.test(String(phoneNumber).trim())) {
    throw httpError(400, 'Phone number must contain exactly 10 digits.');
  }
  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters long.');

  const { accounts, otpVerifications } = getCollections();
  const normalizedEmail = email.toLowerCase();
  const otpRecord = await otpVerifications.findOne({ email: normalizedEmail });

  if (!otpRecord || !otpRecord.verified || otpRecord.expiresAt < new Date()) {
    throw httpError(400, 'Please verify your email with OTP before registering.');
  }

  if (await accounts.findOne({ email: normalizedEmail })) {
    throw httpError(409, 'An account with this email already exists.');
  }

  const now = new Date();
  const newUser = {
    name,
    email: normalizedEmail,
    phoneNumber: phoneNumber.trim(),
    password: await bcrypt.hash(password, 10),
    role: normalizeRole(role),
    createdAt: now,
    updatedAt: now,
  };

  const result = await accounts.insertOne(newUser);
  await otpVerifications.deleteOne({ email: normalizedEmail });

  const user = {
    userId: result.insertedId.toString(),
    name: newUser.name,
    email: newUser.email,
    phoneNumber: newUser.phoneNumber,
    role: newUser.role,
  };

  return { message: 'Account registered successfully.', token: generateToken({ _id: result.insertedId, ...user }), user };
}

async function login({ email, password }) {
  if (!email || !password) throw httpError(400, 'Email and password are required.');

  const { accounts } = getCollections();
  const user = await accounts.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw httpError(401, 'Invalid email or password.');
  }

  return {
    message: 'Login successful.',
    token: generateToken(user),
    user: {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: normalizeRole(user.role),
    },
  };
}

async function getCurrentUser(userId) {
  const { accounts } = getCollections();
  const { ObjectId } = require('mongodb');
  const user = await accounts.findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } });
  if (!user) throw httpError(404, 'User not found.');

  return {
    user: {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: normalizeRole(user.role),
    },
  };
}

async function listUsers() {
  const { accounts } = getCollections();
  const users = await accounts.find({}, { projection: { password: 0 } }).toArray();
  return {
    users: users.map((user) => ({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: normalizeRole(user.role),
      roleLabel: roleLabel(user.role),
      createdAt: user.createdAt,
    })),
  };
}

module.exports = { sendOtp, verifyOtp, register, login, getCurrentUser, listUsers };
