require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./app/routes');
const errorHandler = require('./app/middlewares/error.middleware');
const db = require('./app/models');
const schedulerService = require('./app/service/scheduler.service');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

// Start Server & Sync Database / Scheduler
async function bootstrap() {
  try {
    await db.sequelize.authenticate();
    console.log('[Database] Connected to PostgreSQL successfully.');

    // Sync database models automatically for development
    await db.sequelize.sync({ alter: false });

    // Sync schedules with BullMQ on startup
    await schedulerService.syncSchedulesWithBullMQ();

    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`Backend Express API running on port ${PORT}`);
      console.log(`Health endpoint: http://localhost:${PORT}/health`);
      console.log(`Scheduler API: http://localhost:${PORT}/api/v1/scheduler/jobs`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('[Bootstrap Error]: Failed to initialize server:', error);
  }
}

bootstrap();

module.exports = app;
