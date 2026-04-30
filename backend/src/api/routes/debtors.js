const { debtRouter } = require('./_routes');
const router = require('express').Router();
const prisma = require('../../db');
const roleCheck = require('../middleware/roleCheck');
const { Telegraf } = require('telegraf');

// Qarzdorlar ro'yxati
router.get('/', roleCheck('admin', 'receptionist'), async (req, res) => {
  const { debtRouter: dr } = require('./_routes');
  return dr.handle ? dr.handle(req, res) : debtRouter(req, res);
});

// Xabar yuborish
router.post('/notify', roleCheck('admin', 'receptionist'), async (req, res) => {
  try {
    const { groupId, monthYear, maxAmount } = req.body;
    if (!groupId || !monthYear) return res.status(400).json({ error: 'groupId va monthYear kerak' });

    const bot = new Telegraf(process.env.BOT_TOKEN);
    const settings = await prisma.settings.findMany();
    const settingsMap = {};
    settings.forEach(s => settingsMap[s.key] = s.value);
    const channelId = settingsMap['report_channel_id'];
    if (!channelId) return res.status(400).json({ error: 'Hisobot kanali sozlanmagan' });

    // Guruh va o'quvchilar
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { subject: true }
    });
    const groupStudents = await prisma.groupStudent.findMany({
      where: { groupId, status: 'active' },
      include: {
        student: {
          include: {
            applicant: { select: { firstName: true, lastName: true, phoneSelf: true, phoneFather: true } },
            payments: { where: { groupId, monthYear } }
          }
        }
      }
    });

    // Qarzdorlarni filtrlash
    const debtors = groupStudents.filter(gs => {
      const paid = gs.student.payments.reduce((s, p) => s + p.amount, BigInt(0));
      if (maxAmount) return paid < BigInt(maxAmount);
      return paid === BigInt(0);
    });

    if (!debtors.length) return res.status(400).json({ error: 'Qarzdorlar yo\'q' });

    // Oy nomini formatlash
    const [y, m] = monthYear.split('-');
    const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
    const monthLabel = months[parseInt(m) - 1] + ' ' + y;

    let text = `⚠️ <b>Qarzdorlar ro'yxati</b>\n`;
    text += `━━━━━━━━━━━━━━━━\n`;
    text += `📚 Fan: ${group.subject.name}\n`;
    text += `📅 Oy: ${monthLabel}\n\n`;

    debtors.forEach((gs, i) => {
      const a = gs.student.applicant;
      const paid = gs.student.payments.reduce((s, p) => s + p.amount, BigInt(0));
      const phone = a.phoneSelf || a.phoneFather || '';
      text += `${i + 1}. <b>${a.firstName} ${a.lastName}</b>`;
      if (paid > BigInt(0)) text += ` — ${Number(paid).toLocaleString('ru-RU')} so'm to'langan`;
      if (phone) text += `\n   📞 ${phone}`;
      text += '\n';
    });

    text += `\n👥 Jami: <b>${debtors.length} ta</b> qarzdor`;

    await bot.telegram.sendMessage(channelId, text, { parse_mode: 'HTML' });
    res.json({ success: true });
  } catch (e) {
    console.error('Debtors notify xatolik:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET endpoint ni to'g'ridan to'g'ri o'zimiz yozamiz
router.get('/', async (req, res) => {
  try {
    const { monthYear, maxAmount } = req.query;
    if (!monthYear) return res.status(400).json({ error: 'Oy kerak' });

    const groupStudents = await prisma.groupStudent.findMany({
      where: { status: 'active' },
      include: {
        group: { include: { subject: true } },
        student: {
          include: {
            applicant: { select: { firstName: true, lastName: true, phoneSelf: true, phoneFather: true, phoneMother: true } },
            payments: { where: { monthYear } }
          }
        }
      }
    });

    const result = {};
    for (const gs of groupStudents) {
      const groupPayments = gs.student.payments.filter(p => p.groupId === gs.groupId);
      const paidAmount = groupPayments.reduce((s, p) => s + p.amount, BigInt(0));
      const targetAmount = groupPayments.find(p => p.targetAmount)?.targetAmount || null;
      const maxAmt = maxAmount ? BigInt(maxAmount) : BigInt(1);
      const isDebtor = maxAmount ? paidAmount < maxAmt : paidAmount === BigInt(0);

      if (isDebtor) {
        const key = gs.groupId;
        if (!result[key]) {
          result[key] = { groupId: gs.groupId, groupName: gs.group.name, subjectName: gs.group.subject.name, students: [] };
        }
        result[key].students.push({
          studentId: gs.student.id,
          firstName: gs.student.applicant.firstName,
          lastName: gs.student.applicant.lastName,
          phoneSelf: gs.student.applicant.phoneSelf,
          phoneFather: gs.student.applicant.phoneFather,
          paidAmount: paidAmount.toString(),
          targetAmount: targetAmount?.toString() || null,
          remainingAmount: targetAmount ? (targetAmount - paidAmount).toString() : null
        });
      }
    }
    res.json(Object.values(result));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
