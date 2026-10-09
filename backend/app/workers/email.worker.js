const { Worker } = require('bullmq');
const { redisConfig } = require('../config/redis');

function initEmailWorker() {
  console.log('[Worker] Initializing Email Worker...');
  const worker = new Worker(
    'email-queue',
    async (job) => {
      console.log(`[EmailWorker] Processing job ${job.id}:`, job.data);
      // Process email sending logic
      return { status: 'SENT', recipient: job.data.recipient };
    },
    { connection: redisConfig }
  );

  worker.on('completed', (job) => console.log(`[EmailWorker] Job ${job.id} completed.`));
  worker.on('failed', (job, err) => console.error(`[EmailWorker] Job ${job.id} failed:`, err));

  return worker;
}

module.exports = { initEmailWorker };
