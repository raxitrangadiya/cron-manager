const schedulerService = require('../service/scheduler.service');

class SchedulerController {
  async getDashboardMetrics(req, res, next) {
    try {
      const metrics = await schedulerService.getDashboardMetrics();
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableJobTypes(req, res, next) {
    try {
      const types = schedulerService.getAvailableJobTypes();
      res.json({ success: true, data: types });
    } catch (error) {
      next(error);
    }
  }

  async getAllCronJobs(req, res, next) {
    try {
      const jobs = await schedulerService.getAllCronJobs();
      res.json({ success: true, data: jobs });
    } catch (error) {
      next(error);
    }
  }

  async getCronJobById(req, res, next) {
    try {
      const job = await schedulerService.getCronJobById(req.params.id);
      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  async createCronJob(req, res, next) {
    try {
      const job = await schedulerService.createCronJob(req.body);
      res.status(201).json({ success: true, data: job, message: 'Cron job created successfully.' });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async updateCronJob(req, res, next) {
    try {
      const job = await schedulerService.updateCronJob(req.params.id, req.body);
      res.json({ success: true, data: job, message: 'Cron job updated successfully.' });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async pauseCronJob(req, res, next) {
    try {
      const job = await schedulerService.pauseCronJob(req.params.id);
      res.json({ success: true, data: job, message: 'Cron job paused.' });
    } catch (error) {
      next(error);
    }
  }

  async resumeCronJob(req, res, next) {
    try {
      const job = await schedulerService.resumeCronJob(req.params.id);
      res.json({ success: true, data: job, message: 'Cron job resumed.' });
    } catch (error) {
      next(error);
    }
  }

  async triggerJobNow(req, res, next) {
    try {
      const result = await schedulerService.triggerJobNow(req.params.id);
      res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  async deleteCronJob(req, res, next) {
    try {
      const result = await schedulerService.deleteCronJob(req.params.id);
      res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  async getJobLogs(req, res, next) {
    try {
      const logs = await schedulerService.getJobLogs(req.params.id);
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SchedulerController();
