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

// Helper function to self-heal and seed database enum/table compatibility
async function healDatabaseSchema() {
  try {
    // 1. Convert scheduleType from PostgreSQL ENUM to VARCHAR(255) if necessary
    await db.sequelize.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_schedule_patterns_scheduleType') THEN 
          ALTER TABLE "schedule_patterns" ALTER COLUMN "scheduleType" TYPE VARCHAR(255) USING "scheduleType"::text;
          DROP TYPE "enum_schedule_patterns_scheduleType";
        END IF;
      END $$;
    `).catch(() => {});

    // 2. Sync database models
    await db.sequelize.sync({ alter: true });

    // 3. Seed default system presets if SchedulePattern table is empty
    const count = await db.SchedulePattern.count();
    if (count === 0) {
      console.log('[Database] Seeding default Schedule Pattern Masters...');
      await db.SchedulePattern.bulkCreate([
        {
          id: '10000000-0000-0000-0000-000000000001',
          name: 'Every 5 Minutes Task',
          description: 'Repeats continuously every 5 minutes',
          scheduleType: 'INTERVAL',
          repeatIntervalMinutes: 5,
          cronExpression: '*/5 * * * *',
          isPreset: true
        },
        {
          id: '10000000-0000-0000-0000-000000000002',
          name: 'Daily Morning Business Run (9:00 AM)',
          description: 'Triggers every day at 9:00 AM',
          scheduleType: 'DAILY',
          timeOfDay: '09:00',
          cronExpression: '0 9 * * *',
          isPreset: true
        },
        {
          id: '10000000-0000-0000-0000-000000000003',
          name: 'Weekday Work Hours (Mon-Fri 9 AM)',
          description: 'Triggers Monday through Friday at 9:00 AM',
          scheduleType: 'WEEKLY',
          timeOfDay: '09:00',
          daysOfWeek: [1, 2, 3, 4, 5],
          cronExpression: '0 9 * * 1-5',
          isPreset: true
        },
        {
          id: '10000000-0000-0000-0000-000000000004',
          name: 'Monthly Payroll / Audit Run (1st of Month)',
          description: 'Triggers on the 1st of every month at midnight',
          scheduleType: 'MONTHLY_DATE',
          timeOfDay: '00:00',
          dayOfMonth: 1,
          cronExpression: '0 0 1 * *',
          isPreset: true
        },
        {
          id: '10000000-0000-0000-0000-000000000005',
          name: 'Semi-Annual Financial Review (Jan & Jul 1st)',
          description: 'Triggers twice a year on January 1st and July 1st at 9:00 AM',
          scheduleType: 'SEMI_ANNUALLY',
          timeOfDay: '09:00',
          dayOfMonth: 1,
          cronExpression: '0 9 1 1,7 *',
          isPreset: true
        },
        {
          id: '10000000-0000-0000-0000-000000000006',
          name: 'Annual Tax Compliance (March 31st)',
          description: 'Triggers once a year on March 31st at 9:00 AM',
          scheduleType: 'YEARLY_DATE',
          timeOfDay: '09:00',
          dayOfMonth: 31,
          cronExpression: '0 9 31 3 *',
          isPreset: true
        },
        {
          id: '10000000-0000-0000-0000-000000000007',
          name: 'Yearly Kickoff (First Monday of January)',
          description: 'Triggers every year on the first Monday of January at 9:00 AM',
          scheduleType: 'YEARLY_RELATIVE',
          timeOfDay: '09:00',
          cronExpression: '0 9 1-7 1 1',
          isPreset: true
        }
      ]);
    }
  } catch (err) {
    console.error('[Database Self-Heal Error]:', err.message);
  }
}

// Start Server & Sync Database / Scheduler
async function bootstrap() {
  try {
    await db.sequelize.authenticate();
    console.log('[Database] Connected to PostgreSQL successfully.');

    // Heal & sync database schema
    await healDatabaseSchema();

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
