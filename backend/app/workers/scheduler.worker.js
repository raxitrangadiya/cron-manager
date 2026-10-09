const { Worker } = require('bullmq');
const { redisConfig } = require('../config/redis');
const { getJobHandler } = require('./handlers');
const { CronJob, CronJobLog } = require('../models');
const cronParser = require('cron-parser');

function initSchedulerWorker() {
  console.log('[Worker] Initializing Scheduler Worker (BullMQ)...');

  const worker = new Worker(
    'scheduler-queue',
    async (job) => {
      const { cronJobId, jobType, payload, name } = job.data;
      const startTime = Date.now();

      console.log(`[SchedulerWorker] Executing job "${name}" (${cronJobId}) [Type: ${jobType}]`);

      // Create log entry in RUNNING state
      let logEntry;
      try {
        logEntry = await CronJobLog.create({
          jobId: cronJobId,
          status: 'RUNNING',
          runAt: new Date()
        });
      } catch (err) {
        console.error('[SchedulerWorker] Failed to create initial log entry:', err);
      }

      try {
        // Resolve predefined handler securely
        const handler = getJobHandler(jobType);

        // Execute handler
        const result = await handler(payload || {});
        const executionTimeMs = Date.now() - startTime;

        // Calculate next run time
        let nextRunAt = null;
        const cronJob = await CronJob.findByPk(cronJobId);
        if (cronJob && cronJob.cronExpression) {
          try {
            const interval = cronParser.parseExpression(cronJob.cronExpression, {
              tz: cronJob.timezone || 'Asia/Kolkata'
            });
            nextRunAt = interval.next().toDate();
          } catch (e) {
            console.warn('[SchedulerWorker] Could not parse next run date:', e.message);
          }
        }

        // Update CronJob status record
        if (cronJob) {
          await cronJob.update({
            lastRunAt: new Date(),
            nextRunAt: nextRunAt || cronJob.nextRunAt
          });
        }

        // Update log entry to SUCCESS
        if (logEntry) {
          await logEntry.update({
            status: 'SUCCESS',
            executionTimeMs,
            result
          });
        }

        return result;

      } catch (error) {
        const executionTimeMs = Date.now() - startTime;
        console.error(`[SchedulerWorker] Error executing job ${name}:`, error.message);

        // Update log entry to FAILED
        if (logEntry) {
          await logEntry.update({
            status: 'FAILED',
            executionTimeMs,
            errorDetails: error.stack || error.message
          });
        }

        throw error;
      }
    },
    {
      connection: redisConfig,
      concurrency: 5
    }
  );

  worker.on('completed', (job) => {
    console.log(`[SchedulerWorker] Job "${job.data.name}" completed successfully.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[SchedulerWorker] Job "${job?.data?.name || job?.id}" failed with error:`, err.message);
  });

  return worker;
}

module.exports = { initSchedulerWorker };
