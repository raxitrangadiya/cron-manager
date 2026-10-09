const express = require('express');
const router = express.Router();
const schedulerController = require('../controllers/scheduler.controller');

// Dashboard metrics & predefined job types
router.get('/metrics', schedulerController.getDashboardMetrics);
router.get('/job-types', schedulerController.getAvailableJobTypes);

// Cron Jobs CRUD
router.get('/jobs', schedulerController.getAllCronJobs);
router.get('/jobs/:id', schedulerController.getCronJobById);
router.post('/jobs', schedulerController.createCronJob);
router.put('/jobs/:id', schedulerController.updateCronJob);
router.delete('/jobs/:id', schedulerController.deleteCronJob);

// Actions
router.patch('/jobs/:id/pause', schedulerController.pauseCronJob);
router.patch('/jobs/:id/resume', schedulerController.resumeCronJob);
router.post('/jobs/:id/trigger', schedulerController.triggerJobNow);

// Logs
router.get('/jobs/:id/logs', schedulerController.getJobLogs);

module.exports = router;
