require('dotenv').config();
const { execSync } = require('child_process');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { Telegraf } = require('telegraf');
const prisma = require('./db');
const cronService = require('./services/cronService');

// DB push at startup
try {
  execSync('npx prisma db push --schema=backend/prisma/schema.prisma --accept-data-loss', {
    stdio: 'inherit', env: process.env
  });
  console.log('✅ DB tayyor');
} catch (e) {
  console.error('DB xatolik:', e.message);
}

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, '../../frontend')));

// Routes
app.use('/api/auth',        require('./api/routes/auth'));
app.use('/api/subjects',    require('./api/routes/subjects'));
app.use('/api/groups',      require('./api/routes/groups'));
app.use('/api/staff',       require('./api/routes/staff'));
app.use('/api/applicants',  require('./api/routes/applicants'));
app.use('/api/students',    require('./api/routes/students'));
app.use('/api/schedule',    require('./api/routes/schedule'));
app.use('/api/attendance',  require('./api/routes/attendance'));
app.use('/api/payments',    require('./api/routes/payments'));
app.use('/api/expenses',    require('./api/routes/expenses'));
app.use('/api/conversions', require('./api/routes/conversions'));
app.use('/api/statistics',  require('./api/routes/statistics'));
app.use('/api/debtors',     require('./api/routes/debtors'));
app.use('/api/balance',     require('./api/routes/balance'));
app.use('/api/results',     require('./api/routes/results'));
app.use('/api/settings',    require('./api/routes/settings'));

// Bot
require('./bot')(bot);

// Webhook
const WEBHOOK_PATH = '/telegram-webhook';
app.post(WEBHOOK_PATH, (req, res) => {
  res.sendStatus(200);
  bot.handleUpdate(req.body).catch(err => console.error('Bot xatolik:', err.message));
});

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/telegram-webhook')) {
    res.sendFile(path.join(__dirname, '../../frontend/admin.html'));
  }
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL ulandi');

    app.listen(PORT, async () => {
      console.log(`🚀 Server port ${PORT}`);
      if (process.env.NODE_ENV === 'production' && process.env.WEBHOOK_URL) {
        const url = `${process.env.WEBHOOK_URL}${WEBHOOK_PATH}`;
        await bot.telegram.setWebhook(url);
        console.log(`✅ Webhook: ${url}`);
      } else {
        bot.launch();
        console.log('🤖 Polling rejim');
      }
      cronService.start();
    });
  } catch (err) {
    console.error('❌ Server xatolik:', err);
    process.exit(1);
  }
}

start();
process.once('SIGINT', () => { bot.stop('SIGINT'); prisma.$disconnect(); });
process.once('SIGTERM', () => { bot.stop('SIGTERM'); prisma.$disconnect(); });
