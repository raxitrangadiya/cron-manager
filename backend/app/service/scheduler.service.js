const { Queue } = require('bullmq');
const { redisConfig } = require('../config/redis');
const { CronJob, CronJobLog } = require('../models');
const { validateCronExpression, getNextRunDate } = require('../utils/cronValidator');
const { getJobHandler, jobHandlers } = require('../workers/handlers');

// Create dedicated BullMQ queue for scheduled jobs
const schedulerQueue = new Queue('scheduler-queue', { connection: redisConfig });

class SchedulerService {
  /**
   * Helper to compute BullMQ repeat key format
   */
  static getRepeatJobId(cronJobId) {
    return `job:${cronJobId}`;
  }

  /**
   * Startup Sync: Reads all ACTIVE jobs from PostgreSQL and ensures they are scheduled in BullMQ.
   * Ensures schedules survive API, Worker, Redis, and Server restarts.
   */
  async syncSchedulesWithBullMQ() {
    console.log('[SchedulerService] Synchronizing schedules from PostgreSQL to BullMQ...');
    try {
      // Fetch all active jobs from DB
      const activeJobs = await CronJob.findAll({ where: { status: 'ACTIVE' } });
      
      // Clean existing repeatable jobs in BullMQ to start clean
      const existingRepeatableJobs = await schedulerQueue.getRepeatableJobs();
      for (const repeatJob of existingRepeatableJobs) {
        await schedulerQueue.removeRepeatableByKey(repeatJob.key);
      }

      let count = 0;
      for (const job of activeJobs) {
        await this.addRepeatableJobToBullMQ(job);
        count++;
      }
      console.log(`[SchedulerService] Successfully synchronized ${count} active jobs into BullMQ queue.`);
    } catch (err) {
      console.error('[SchedulerService] Failed to sync schedules with BullMQ:', err.message);
    }
  }

  /**
   * Helper: Registers a repeatable job in BullMQ
   */
  async addRepeatableJobToBullMQ(cronJob) {
    const jobData = {
      cronJobId: cronJob.id,
      name: cronJob.name,
      jobType: cronJob.jobType,
      payload: cronJob.payload
    };

    await schedulerQueue.add(
      cronJob.name,
      jobData,
      {
        repeat: {
          pattern: cronJob.cronExpression,
          tz: cronJob.timezone || 'Asia/Kolkata'
        },
        jobId: SchedulerService.getRepeatJobId(cronJob.id)
      }
    );
  }

  /**
   * Helper: Removes repeatable job from BullMQ
   */
  async removeRepeatableJobFromBullMQ(cronJob) {
    const repeatableJobs = await schedulerQueue.getRepeatableJobs();
    const targetJobId = SchedulerService.getRepeatJobId(cronJob.id);
    
    for (const job of repeatableJobs) {
      if (job.id === targetJobId || job.key.includes(cronJob.id)) {
        await schedulerQueue.removeRepeatableByKey(job.key);
      }
    }
  }

  /**
   * Get list of supported predefined job types
   */
  getAvailableJobTypes() {
    return Object.keys(jobHandlers).map(key => ({
      key,
      name: key.replace(/_/g, ' ')
    }));
  }

  /**
   * Get all cron jobs with optional pagination and filtering
   */
  async getAllCronJobs() {
    const jobs = await CronJob.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: CronJobLog,
          as: 'logs',
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    return jobs;
  }

  /**
   * Get single job by ID with logs
   */
  async getCronJobById(id) {
    const job = await CronJob.findByPk(id, {
      include: [
        {
          model: CronJobLog,
          as: 'logs',
          limit: 20,
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    if (!job) {
      throw new Error(`Cron Job with ID ${id} not found.`);
    }
    return job;
  }

  /**
   * Create a new scheduled job
   */
  async createCronJob(data) {
    const { name, jobType, cronExpression, timezone = 'Asia/Kolkata', payload = {} } = data;

    // 1. Validate predefined jobType
    getJobHandler(jobType);

    // 2. Validate cron expression
    const validation = validateCronExpression(cronExpression, timezone);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const nextRunAt = getNextRunDate(cronExpression, timezone);

    // 3. Save to PostgreSQL (Source of Truth)
    const newJob = await CronJob.create({
      name,
      jobType,
      cronExpression: cronExpression.trim(),
      timezone,
      payload,
      status: 'ACTIVE',
      nextRunAt
    });

    // 4. Add to BullMQ Queue
    await this.addRepeatableJobToBullMQ(newJob);

    return newJob;
  }

  /**
   * Update an existing scheduled job
   */
  async updateCronJob(id, data) {
    const job = await CronJob.findByPk(id);
    if (!job) {
      throw new Error(`Cron Job with ID ${id} not found.`);
    }

    const { name, jobType, cronExpression, timezone, payload, status } = data;

    if (jobType) {
      getJobHandler(jobType);
    }

    let nextRunAt = job.nextRunAt;
    if (cronExpression) {
      const tz = timezone || job.timezone;
      const validation = validateCronExpression(cronExpression, tz);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      nextRunAt = getNextRunDate(cronExpression, tz);
    }

    // 1. Remove old schedule from BullMQ
    await this.removeRepeatableJobFromBullMQ(job);

    // 2. Update PostgreSQL
    await job.update({
      name: name !== undefined ? name : job.name,
      jobType: jobType !== undefined ? jobType : job.jobType,
      cronExpression: cronExpression !== undefined ? cronExpression.trim() : job.cronExpression,
      timezone: timezone !== undefined ? timezone : job.timezone,
      payload: payload !== undefined ? payload : job.payload,
      status: status !== undefined ? status : job.status,
      nextRunAt
    });

    // 3. If still active, add updated schedule to BullMQ
    if (job.status === 'ACTIVE') {
      await this.addRepeatableJobToBullMQ(job);
    }

    return job;
  }

  /**
   * Pause a cron job
   */
  async pauseCronJob(id) {
    const job = await CronJob.findByPk(id);
    if (!job) {
      throw new Error(`Cron Job with ID ${id} not found.`);
    }

    await this.removeRepeatableJobFromBullMQ(job);
    await job.update({ status: 'PAUSED' });
    return job;
  }

  /**
   * Resume a paused cron job
   */
  async resumeCronJob(id) {
    const job = await CronJob.findByPk(id);
    if (!job) {
      throw new Error(`Cron Job with ID ${id} not found.`);
    }

    const nextRunAt = getNextRunDate(job.cronExpression, job.timezone);
    await job.update({ status: 'ACTIVE', nextRunAt });
    await this.addRepeatableJobToBullMQ(job);
    return job;
  }

  /**
   * Trigger job manually now (Ad-hoc run)
   */
  async triggerJobNow(id) {
    const job = await CronJob.findByPk(id);
    if (!job) {
      throw new Error(`Cron Job with ID ${id} not found.`);
    }

    // Add a single-use immediate job to the queue
    await schedulerQueue.add(
      `manual-trigger-${job.name}`,
      {
        cronJobId: job.id,
        name: `${job.name} (Manual)`,
        jobType: job.jobType,
        payload: job.payload
      }
    );

    return { message: `Job "${job.name}" triggered successfully.` };
  }

  /**
   * Delete a cron job
   */
  async deleteCronJob(id) {
    const job = await CronJob.findByPk(id);
    if (!job) {
      throw new Error(`Cron Job with ID ${id} not found.`);
    }

    await this.removeRepeatableJobFromBullMQ(job);
    await job.destroy();
    return { message: `Cron Job ${id} deleted successfully.` };
  }

  /**
   * Get logs for a specific job
   */
  async getJobLogs(jobId, limit = 50) {
    const logs = await CronJobLog.findAll({
      where: { jobId },
      order: [['createdAt', 'DESC']],
      limit
    });
    return logs;
  }

  /**
   * Get Dashboard Metrics
   */
  async getDashboardMetrics() {
    const totalJobs = await CronJob.count();
    const activeJobs = await CronJob.count({ where: { status: 'ACTIVE' } });
    const pausedJobs = await CronJob.count({ where: { status: 'PAUSED' } });
    const totalLogs = await CronJobLog.count();
    const failedLogs = await CronJobLog.count({ where: { status: 'FAILED' } });
    const successLogs = await CronJobLog.count({ where: { status: 'SUCCESS' } });

    return {
      totalJobs,
      activeJobs,
      pausedJobs,
      totalLogs,
      failedLogs,
      successLogs
    };
  }
}

module.exports = new SchedulerService();
