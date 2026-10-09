const { Worker } = require('bullmq');
const { redisConfig } = require('../config/redis');

function initEncryptionRotationWorker() {
  console.log('[Worker] Initializing Encryption Rotation Worker...');
  const worker = new Worker(
    'encryption-rotation-queue',
    async (job) => {
      console.log(`[EncryptionWorker] Processing rotation job ${job.id}:`, job.data);
      return { status: 'ROTATED', timestamp: new Date().toISOString() };
    },
    { connection: redisConfig }
  );

  worker.on('completed', (job) => console.log(`[EncryptionWorker] Job ${job.id} completed.`));
  worker.on('failed', (job, err) => console.error(`[EncryptionWorker] Job ${job.id} failed:`, err));

  return worker;
}

module.exports = { initEncryptionRotationWorker };
