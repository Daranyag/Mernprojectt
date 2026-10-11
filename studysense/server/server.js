require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

// Validate critical environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error(`[Fatal] Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please configure them in server/.env before starting.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Fatal] Uncaught Exception:', err.name, err.message);
  process.exit(1);
});

// Start Server after Database Connection
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 StudySense Backend API running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Allowed Client: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      console.log(`====================================================`);
    });

    // Catch unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('[Fatal] Unhandled Rejection:', err.name, err.message);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error('[Fatal] Failed to initialize server:', error.message);
    process.exit(1);
  }
};

startServer();
