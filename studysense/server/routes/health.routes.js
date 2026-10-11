const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { sendSuccess } = require('../utils/response.utils');

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  return sendSuccess(res, 200, 'StudySense API is healthy and operational', {
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
