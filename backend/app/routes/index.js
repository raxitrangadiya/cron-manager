const express = require('express');
const router = express.Router();
const schedulerRoutes = require('./scheduler.routes');

router.use('/scheduler', schedulerRoutes);

module.exports = router;
