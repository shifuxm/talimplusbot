// auth.js
const { Router } = require('express');
const prisma = require('../../db');
const authRouter = Router();

authRouter.get('/me', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'];
    if (!telegramId) return res.status(401).json({ error: 'Telegram ID kerak' });
    if (telegramId === process.env.ADMIN_TELEGRAM_ID)
      return res.json({ id: 0, role: 'admin', firstName: 'Admin', lastName: '' });

    // 1. telegramId bilan topish (asosiy yo'l)
    let user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
    if (user) return res.json({ ...user, telegramId: user.telegramId.toString() });

    // 2. Topilmadi - hodim /start bosmasdan to'g'ridan CRM ga kirgan bo'lishi mumkin
    // Bu holda 404 qaytaramiz - frontend "Botdan /start bosing" deydi
    return res.status(404).json({ error: 'Foydalanuvchi topilmadi. Botdan /start bosing.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// subjects.js
const subRouter = Router();

subRouter.get('/', async (req, res) => {
  const s = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
  res.json(s);
});
subRouter.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Fan nomi kerak' });
    const s = await prisma.subject.create({ data: { name: name.trim() } });
    res.json(s);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Bu fan allaqachon mavjud' });
    res.status(500).json({ error: e.message });
  }
});
subRouter.delete('/:id', async (req, res) => {
  await prisma.subject.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

// staff.js
const staffRouter = Router();
const roleCheck = require('../middleware/roleCheck');

staffRouter.get('/', roleCheck('admin', 'receptionist'), async (req, res) => {
  const { role } = req.query;
  const where = role ? { role } : { role: { in: ['teacher', 'receptionist'] } };
  const staff = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(staff.map(s => ({ ...s, telegramId: s.telegramId.toString() })));
});

staffRouter.get('/teachers', roleCheck('admin', 'receptionist'), async (req, res) => {
  const { subject } = req.query;
  const where = { role: 'teacher' };
  if (subject) where.subject = { equals: subject, mode: 'insensitive' };
  const teachers = await prisma.user.findMany({ where, orderBy: { firstName: 'asc' } });
  res.json(teachers.map(t => ({ ...t, telegramId: t.telegramId.toString() })));
});

staffRouter.post('/', roleCheck('admin'), async (req, res) => {
  try {
    const { telegramId, role, firstName, lastName, phone, subject } = req.body;
    if (!telegramId || !role || !firstName || !lastName) return res.status(400).json({ error: 'Barcha maydonlar kerak' });
    if (role === 'teacher' && !subject) return res.status(400).json({ error: 'Fan kerak' });
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: { role, firstName, lastName, phone, subject },
      create: { telegramId: BigInt(telegramId), role, firstName, lastName, phone, subject }
    });
    res.json({ ...user, telegramId: user.telegramId.toString() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

staffRouter.put('/:id', roleCheck('admin'), async (req, res) => {
  const { firstName, lastName, phone, subject, role } = req.body;
  const user = await prisma.user.update({ where: { id: parseInt(req.params.id) }, data: { firstName, lastName, phone, subject, role } });
  res.json({ ...user, telegramId: user.telegramId.toString() });
});

staffRouter.delete('/:id', roleCheck('admin'), async (req, res) => {
  const { action } = req.query;
  if (action === 'delete') {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
  }
  res.json({ success: true });
});

// settings.js
const settingsRouter = Router();

settingsRouter.get('/', async (req, res) => {
  const settings = await prisma.settings.findMany();
  const result = {};
  settings.forEach(s => result[s.key] = s.value);
  res.json(result);
});

settingsRouter.put('/', roleCheck('admin'), async (req, res) => {
  const updates = req.body; // { report_channel_id: '...', ... }
  for (const [key, value] of Object.entries(updates)) {
    await prisma.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });
  }
  res.json({ success: true });
});

module.exports = { authRouter, subRouter, staffRouter, settingsRouter };
