const mongoose = require('mongoose');

/**
 * Connect to MongoDB with intelligent fallback:
 * 1. Tries primary MONGO_URI (e.g., MongoDB Atlas)
 * 2. If Atlas is unreachable due to IP whitelisting, falls back to local MongoDB
 */
const connectDB = async () => {
  const primaryURI = process.env.MONGO_URI;
  const localFallbackURI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/studysense';

  if (!primaryURI && !localFallbackURI) {
    console.error('[Database Error] MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  let connectionURI = primaryURI;

  try {
    console.log('[Database] Attempting connection to primary MongoDB URI...');
    const conn = await mongoose.connect(connectionURI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000, // Quick 5s timeout to avoid long hanging
    });

    console.log(`[Database] MongoDB connected: ${conn.connection.host} / Database: ${conn.connection.name}`);
    setupConnectionListeners();
    return conn;
  } catch (error) {
    console.warn(`[Database Warning] Primary MongoDB connection failed (${error.message}).`);
    
    // Check if we can fallback to local MongoDB
    if (connectionURI !== localFallbackURI) {
      console.log(`[Database] Attempting fallback to local MongoDB instance: ${localFallbackURI}...`);
      try {
        const localConn = await mongoose.connect(localFallbackURI, {
          autoIndex: true,
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`[Database] Connected to Local MongoDB fallback: ${localConn.connection.host} / Database: ${localConn.connection.name}`);
        setupConnectionListeners();
        return localConn;
      } catch (localErr) {
        console.error(`[Database Error] Local MongoDB fallback also failed: ${localErr.message}`);
        throw error;
      }
    } else {
      throw error;
    }
  }
};

function setupConnectionListeners() {
  mongoose.connection.on('error', (err) => {
    console.error('[Database Error] MongoDB runtime connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database Warning] MongoDB disconnected.');
  });

  const handleShutdown = async (signal) => {
    console.log(`\n[Database] Received ${signal}. Closing MongoDB connection gracefully...`);
    try {
      await mongoose.connection.close(false);
      console.log('[Database] MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('[Database Error] Error during connection close:', err.message);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

module.exports = connectDB;
