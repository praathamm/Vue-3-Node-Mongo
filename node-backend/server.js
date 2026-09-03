require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { port } = require('./config');
const { connectDatabase } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || localOriginPattern.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.use(healthRoutes);
app.use(authRoutes);
app.use(userRoutes);
app.use(shipmentRoutes);
app.use(trackingRoutes);

connectDatabase();

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
