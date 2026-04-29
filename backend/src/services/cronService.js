const cron = require('node-cron');
const { sendApplicantsReport } = require('./notificationService');

function start() {
  cron.schedule('0 8 * * *', async () => {
    console.log('Cron 08:00: qabul hisoboti...');
    await sendApplicantsReport();
  }, { timezone: 'Asia/Tashkent' });

  cron.schedule('0 16 * * *', async () => {
    console.log('Cron 16:00: qabul hisoboti...');
    await sendApplicantsReport();
  }, { timezone: 'Asia/Tashkent' });

  console.log('✅ Cron service ishga tushdi');
}

module.exports = { start };
