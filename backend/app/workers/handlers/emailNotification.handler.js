/**
 * Predefined Handler for EMAIL_NOTIFICATION
 * Sends scheduled email notifications.
 */
module.exports = async function handleEmailNotification(payload) {
  const recipient = payload.recipient || 'admin@example.com';
  const template = payload.template || 'weekly_digest';

  console.log(`[JobHandler: EMAIL_NOTIFICATION] Sending ${template} to ${recipient}...`);

  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    notificationType: 'EMAIL',
    recipient,
    template,
    sentAt: new Date().toISOString(),
    status: 'DELIVERED'
  };
};
