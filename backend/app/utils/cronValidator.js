const cronParser = require('cron-parser');

/**
 * Validates if a given string is a valid Cron expression.
 * @param {string} cronExpression
 * @param {string} timezone
 * @returns {{ valid: boolean, error?: string, nextRuns?: string[] }}
 */
function validateCronExpression(cronExpression, timezone = 'Asia/Kolkata') {
  if (!cronExpression || typeof cronExpression !== 'string') {
    return { valid: false, error: 'Cron expression is required and must be a string.' };
  }

  try {
    const interval = cronParser.parseExpression(cronExpression.trim(), { tz: timezone });
    const nextRuns = [];
    for (let i = 0; i < 3; i++) {
      nextRuns.push(interval.next().toDate().toISOString());
    }
    return { valid: true, nextRuns };
  } catch (err) {
    return { valid: false, error: `Invalid cron expression: ${err.message}` };
  }
}

/**
 * Computes the next run date for a cron expression.
 */
function getNextRunDate(cronExpression, timezone = 'Asia/Kolkata') {
  try {
    const interval = cronParser.parseExpression(cronExpression.trim(), { tz: timezone });
    return interval.next().toDate();
  } catch (err) {
    return null;
  }
}

module.exports = {
  validateCronExpression,
  getNextRunDate
};
