require('dotenv').config();
const { initEmailWorker } = require('./email.worker');
const { initEncryptionRotationWorker } = require('./encryption.rotation.worker');
const { initSchedulerWorker } = require('./scheduler.worker');
const db = require('../models');

async function startWorkers() {
  console.log('==================================================');
  console.log('Starting Unified Application Workers System...');
  console.log('==================================================');

  try {
    await db.sequelize.authenticate();
    console.log('[Database] Connected successfully in worker process.');
  } catch (err) {
    console.warn('[Database] DB authentication in worker failed (will retry on demand):', err.message);
  }

  const emailWorker = initEmailWorker();
  const encryptionWorker = initEncryptionRotationWorker();
  const schedulerWorker = initSchedulerWorker();

  console.log('[Workers] All worker modules initialized and listening for jobs.');

  process.on('SIGTERM', async () => {
    console.log('[Workers] Shutting down workers gracefully...');
    await Promise.all([
      emailWorker.close(),
      encryptionWorker.close(),
      schedulerWorker.close()
    ]);
    process.exit(0);
  });
}

if (require.main === module) {
  startWorkers();
}

module.exports = { startWorkers };
