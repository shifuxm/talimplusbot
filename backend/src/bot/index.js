require('dotenv').config();
const prisma = require('../db');

module.exports = function setupBot(bot) {
  bot.start(async (ctx) => {
    try {
      const tgUser = ctx.from;
      const telegramId = BigInt(tgUser.id);
      const adminId = BigInt(process.env.ADMIN_TELEGRAM_ID);

      if (telegramId === adminId) {
        await prisma.user.upsert({
          where: { telegramId },
          update: { firstName: tgUser.first_name, lastName: tgUser.last_name || '' },
          create: { telegramId, role: 'admin', firstName: tgUser.first_name, lastName: tgUser.last_name || '', username: tgUser.username || '' }
        });
        return ctx.reply(
          `👨‍💼 Admin paneliga xush kelibsiz!\n\nCRM tizimini boshqarish uchun quyidagi tugmani bosing.`,
          { reply_markup: { inline_keyboard: [[{ text: '📊 Admin panelni ochish', web_app: { url: `${process.env.MINI_APP_URL}/admin.html` } }]] } }
        );
      }

      const staff = await prisma.user.findUnique({ where: { telegramId } });
      if (staff) {
        const url = staff.role === 'teacher'
          ? `${process.env.MINI_APP_URL}/teacher.html`
          : `${process.env.MINI_APP_URL}/reception.html`;
        return ctx.reply(
          `👋 Assalomu alaykum, ${staff.firstName}!\n\nCRM tizimiga kirish uchun quyidagi tugmani bosing.`,
          { reply_markup: { inline_keyboard: [[{ text: '📱 CRM ni ochish', web_app: { url } }]] } }
        );
      }

      return ctx.reply(
        `👋 Assalomu alaykum!\n\nDavom etish uchun telefon raqamingizni ulashing:`,
        { reply_markup: { keyboard: [[{ text: '📞 Telefon raqamni ulashish', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true } }
      );
    } catch (err) {
      console.error('Start xatolik:', err);
      ctx.reply('Xatolik yuz berdi. Qayta urinib ko\'ring.').catch(() => {});
    }
  });

  bot.on('contact', async (ctx) => {
    try {
      const contact = ctx.message.contact;
      const tgUser = ctx.from;
      const telegramId = BigInt(tgUser.id);

      await prisma.user.upsert({
        where: { telegramId },
        update: { phone: contact.phone_number, username: tgUser.username || '' },
        create: { telegramId, role: 'receptionist', firstName: tgUser.first_name, lastName: tgUser.last_name || '', username: tgUser.username || '', phone: contact.phone_number }
      });

      await ctx.reply('✅ Telefon raqamingiz saqlandi!', { reply_markup: { remove_keyboard: true } });

      const receptionistUsername = process.env.RECEPTIONIST_USERNAME || 'admin';
      await ctx.reply(
        `🏫 <b>O'quv Markazimiz</b>\n\nYuqori sifatli ta'lim xizmatlarimiz bilan tanishing.\n\n📚 Fanlar va darslar\n👨‍🏫 Tajribali o'qituvchilar\n🏆 Yuqori natijalar`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📝 Qabulga yozilish', web_app: { url: `${process.env.MINI_APP_URL}/public/enroll.html` } },
                { text: '🏆 Natijalar', web_app: { url: `${process.env.MINI_APP_URL}/public/results.html` } }
              ],
              [{ text: '📞 Qabulxona bilan bog\'lanish', url: `https://t.me/${receptionistUsername}` }]
            ]
          }
        }
      );
    } catch (err) {
      console.error('Contact xatolik:', err);
      ctx.reply('Xatolik yuz berdi.').catch(() => {});
    }
  });

  bot.on('message', async (ctx) => {
    try {
      const telegramId = BigInt(ctx.from.id);
      const adminId = BigInt(process.env.ADMIN_TELEGRAM_ID);
      if (telegramId === adminId) {
        return ctx.reply('Admin panelni ochish:', {
          reply_markup: { inline_keyboard: [[{ text: '📊 Admin panelni ochish', web_app: { url: `${process.env.MINI_APP_URL}/admin.html` } }]] }
        });
      }
      const user = await prisma.user.findUnique({ where: { telegramId } });
      if (!user) return ctx.reply('Iltimos /start bosing');
      const url = user.role === 'teacher' ? `${process.env.MINI_APP_URL}/teacher.html` : `${process.env.MINI_APP_URL}/reception.html`;
      ctx.reply('CRM tizimini ochish:', { reply_markup: { inline_keyboard: [[{ text: '📱 Ochish', web_app: { url } }]] } });
    } catch (e) { console.error('Message xatolik:', e); }
  });
};
