const { Queue } = require('bullmq');
const { redisConfig } = require('../config/redis');
const { CronJob, CronJobLog, SchedulePattern } = require('../models');
const { validateCronExpression, getNextRunDate } = require('../utils/cronValidator');
const { getJobHandler, jobHandlers } = require('../workers/handlers');

// Create dedicated BullMQ queue for scheduled jobs
const schedulerQueue = new Queue('scheduler-queue', { connection: redisConfig });

class SchedulerService {
  static getRepeatJobId(cronJobId) {
    return `job:${cronJobId}`;
  }

  async syncSchedulesWithBullMQ() {
    console.log('[SchedulerService] Synchronizing schedules from PostgreSQL to BullMQ...');
    try {
      const activeJobs = await CronJob.findAll({ where: { status: 'ACTIVE' } });
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

  async removeRepeatableJobFromBullMQ(cronJob) {
    const repeatableJobs = await schedulerQueue.getRepeatableJobs();
    const targetJobId = SchedulerService.getRepeatJobId(cronJob.id);
    
    for (const job of repeatableJobs) {
      if (job.id === targetJobId || job.key.includes(cronJob.id)) {
        await schedulerQueue.removeRepeatableByKey(job.key);
      }
    }
  }

  getAvailableJobTypes() {
    return Object.keys(jobHandlers).map(key => ({
      key,
      name: key.replace(/_/g, ' ')
    }));
  }

  async getAllCronJobs() {
    return await CronJob.findAll({
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
  }

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
    if (!job) throw new Error(`Cron Job with ID ${id} not found.`);
    return job;
  }

  async createCronJob(data) {
    const { name, jobType, cronExpression, timezone = 'Asia/Kolkata', payload = {} } = data;
    getJobHandler(jobType);

    const validation = validateCronExpression(cronExpression, timezone);
    if (!validation.valid) throw new Error(validation.error);

    const nextRunAt = getNextRunDate(cronExpression, timezone);

    const newJob = await CronJob.create({
      name,
      jobType,
      cronExpression: cronExpression.trim(),
      timezone,
      payload,
      status: 'ACTIVE',
      nextRunAt
    });

    await this.addRepeatableJobToBullMQ(newJob);
    return newJob;
  }

  async updateCronJob(id, data) {
    const job = await CronJob.findByPk(id);
    if (!job) throw new Error(`Cron Job with ID ${id} not found.`);

    const { name, jobType, cronExpression, timezone, payload, status } = data;
    if (jobType) getJobHandler(jobType);

    let nextRunAt = job.nextRunAt;
    if (cronExpression) {
      const tz = timezone || job.timezone;
      const validation = validateCronExpression(cronExpression, tz);
      if (!validation.valid) throw new Error(validation.error);
      nextRunAt = getNextRunDate(cronExpression, tz);
    }

    await this.removeRepeatableJobFromBullMQ(job);

    await job.update({
      name: name !== undefined ? name : job.name,
      jobType: jobType !== undefined ? jobType : job.jobType,
      cronExpression: cronExpression !== undefined ? cronExpression.trim() : job.cronExpression,
      timezone: timezone !== undefined ? timezone : job.timezone,
      payload: payload !== undefined ? payload : job.payload,
      status: status !== undefined ? status : job.status,
      nextRunAt
    });

    if (job.status === 'ACTIVE') {
      await this.addRepeatableJobToBullMQ(job);
    }

    return job;
  }

  async pauseCronJob(id) {
    const job = await CronJob.findByPk(id);
    if (!job) throw new Error(`Cron Job with ID ${id} not found.`);
    await this.removeRepeatableJobFromBullMQ(job);
    await job.update({ status: 'PAUSED' });
    return job;
  }

  async resumeCronJob(id) {
    const job = await CronJob.findByPk(id);
    if (!job) throw new Error(`Cron Job with ID ${id} not found.`);
    const nextRunAt = getNextRunDate(job.cronExpression, job.timezone);
    await job.update({ status: 'ACTIVE', nextRunAt });
    await this.addRepeatableJobToBullMQ(job);
    return job;
  }

  async triggerJobNow(id) {
    const job = await CronJob.findByPk(id);
    if (!job) throw new Error(`Cron Job with ID ${id} not found.`);

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

  async deleteCronJob(id) {
    const job = await CronJob.findByPk(id);
    if (!job) throw new Error(`Cron Job with ID ${id} not found.`);
    await this.removeRepeatableJobFromBullMQ(job);
    await job.destroy();
    return { message: `Cron Job ${id} deleted successfully.` };
  }

  async getJobLogs(jobId, limit = 50) {
    return await CronJobLog.findAll({
      where: { jobId },
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  async getDashboardMetrics() {
    const totalJobs = await CronJob.count();
    const activeJobs = await CronJob.count({ where: { status: 'ACTIVE' } });
    const pausedJobs = await CronJob.count({ where: { status: 'PAUSED' } });
    const totalLogs = await CronJobLog.count();
    const failedLogs = await CronJobLog.count({ where: { status: 'FAILED' } });
    const successLogs = await CronJobLog.count({ where: { status: 'SUCCESS' } });

    return { totalJobs, activeJobs, pausedJobs, totalLogs, failedLogs, successLogs };
  }

  // Schedule Pattern Masters (Windows Task Scheduler Style)
  async getAllSchedulePatterns() {
    return await SchedulePattern.findAll({
      order: [['isPreset', 'DESC'], ['name', 'ASC']]
    });
  }

  async createSchedulePattern(data) {
    const { name, description, scheduleType, cronExpression } = data;
    const validation = validateCronExpression(cronExpression);
    if (!validation.valid) throw new Error(validation.error);

    return await SchedulePattern.create({
      name,
      description,
      scheduleType: scheduleType || 'CUSTOM',
      cronExpression: cronExpression.trim(),
      isPreset: false
    });
  }

  async deleteSchedulePattern(id) {
    const pattern = await SchedulePattern.findByPk(id);
    if (!pattern) throw new Error('Schedule pattern not found.');
    if (pattern.isPreset) throw new Error('Cannot delete system preset pattern.');
    await pattern.destroy();
    return { message: 'Schedule pattern deleted successfully.' };
  }
}

module.exports = new SchedulerService();
