const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const mongoClient = new MongoClient(mongoUri);

let collections;

async function connectDatabase() {
  try {
    await mongoClient.connect();
    const database = mongoClient.db('courier_tracking_db');

    collections = {
      accounts: database.collection('accounts'),
      shipments: database.collection('shipments'),
      shipmentTracking: database.collection('shipment_tracking'),
      otpVerifications: database.collection('otp_verifications'),
    };

    console.log('Connected to MongoDB');
    return collections;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return null;
  }
}

function getCollections() {
  if (!collections) {
    throw new Error('Database is not ready.');
  }

  return collections;
}

module.exports = { connectDatabase, getCollections };
