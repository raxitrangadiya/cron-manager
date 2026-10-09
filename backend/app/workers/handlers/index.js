const handleDailySalesReport = require('./dailySalesReport.handler');
const handleEmailNotification = require('./emailNotification.handler');
const handleEncryptionRotation = require('./encryptionRotation.handler');
const handleLogCleanup = require('./logCleanup.handler');

/**
 * Registry of predefined job handlers.
 * Maps jobType string stored in DB to executable business logic function.
 * SECURITY: Absolutely NO dynamic code evaluation (eval / new Function).
 */
const jobHandlers = {
  DAILY_SALES_REPORT: handleDailySalesReport,
  EMAIL_NOTIFICATION: handleEmailNotification,
  ENCRYPTION_ROTATION: handleEncryptionRotation,
  LOG_CLEANUP: handleLogCleanup
};

/**
 * Resolves the predefined handler for a given jobType.
 * Throws an error if jobType is unknown or unregistered.
 */
function getJobHandler(jobType) {
  const handler = jobHandlers[jobType];
  if (!handler) {
    throw new Error(`[Security Violation] Unrecognized or unauthorized jobType: "${jobType}". No predefined handler registered.`);
  }
  return handler;
}

module.exports = {
  jobHandlers,
  getJobHandler
};
