require('dotenv').config();
const prisma = require('../db');

// Telefon raqamni normallashtirish
function normalizePhone(phone) {
  if (!phone) return null;
  return phone.replace(/\D/g, '').replace(/^0/, '998');
}

// Bazada o'quvchi/ota-onani telefon raqam orqali topish
async function findApplicantByPhone(phone) {
  const norm = normalizePhone(phone);
  if (!norm) return null;
  const last9 = norm.slice(-9);
  return await prisma.applicant.findFirst({
    where: {
      OR: [
        { phoneSelf: { contains: last9 } },
        { phoneFather: { contains: last9 } },
        { phoneMother: { contains: last9 } }
      ]
    },
    include: {
      student: {
        include: {
          groupStudents: {
            where: { status: 'active' },
            include: { group: { include: { subject: true } } }
          }
        }
      }
    }
  });
}

// O'quvchiga xush kelibsiz xabari
async function sendStudentWelcome(ctx, applicant) {
  const groups = applicant.student?.groupStudents || [];
  let text = `Xush kelibsiz, ${applicant.firstName} ${applicant.lastName}!\n\n`;
  if (groups.length > 0) {
    text += `Qatnashayotgan guruhlaringiz:\n`;
    for (const gs of groups) {
      text += `- ${gs.group.name} (${gs.group.subject.name})\n`;
    }
    text += `\nTo'lov yoki davomat haqida xabarlar shu botga keladi.`;
  } else {
    text += `Hozircha hech qaysi guruhga biriktirilmagansiz.\n`;
    text += `Qabulxona bilan bog'laning.`;
  }
  return ctx.reply(text);
}

module.exports = function setupBot(bot) {

  // /start komandasi
  bot.start(async (ctx) => {
    try {
      const tgUser = ctx.from;
      const telegramId = BigInt(tgUser.id);
      const adminId = BigInt(process.env.ADMIN_TELEGRAM_ID || '0');

      // Admin
      if (telegramId === adminId) {
        await prisma.user.upsert({
          where: { telegramId },
          update: { firstName: tgUser.first_name, lastName: tgUser.last_name || '' },
          create: {
            telegramId, role: 'admin',
            firstName: tgUser.first_name,
            lastName: tgUser.last_name || '',
            username: tgUser.username || ''
          }
        });
        return ctx.reply(
          `Admin paneliga xush kelibsiz!\n\nCRM tizimini boshqarish uchun quyidagi tugmani bosing.`,
          { reply_markup: { inline_keyboard: [[{ text: 'Admin panelni ochish', web_app: { url: `${process.env.MINI_APP_URL}/admin.html` } }]] } }
        );
      }

      // Hodim (teacher/receptionist)
      const staff = await prisma.user.findUnique({ where: { telegramId } });
      if (staff) {
        const url = staff.role === 'teacher'
          ? `${process.env.MINI_APP_URL}/teacher.html`
          : `${process.env.MINI_APP_URL}/reception.html`;
        return ctx.reply(
          `Assalomu alaykum, ${staff.firstName}!\n\nCRM tizimiga kirish uchun quyidagi tugmani bosing.`,
          { reply_markup: { inline_keyboard: [[{ text: 'CRM ni ochish', web_app: { url } }]] } }
        );
      }

      // Bazada telegramId bilan bog'langan o'quvchi/ota-ona
      const knownApplicant = await prisma.applicant.findFirst({
        where: { telegramId },
        include: {
          student: {
            include: {
              groupStudents: {
                where: { status: 'active' },
                include: { group: { include: { subject: true } } }
              }
            }
          }
        }
      });
      if (knownApplicant) {
        return sendStudentWelcome(ctx, knownApplicant);
      }

      // Yangi foydalanuvchi — telefon so'ra
      return ctx.reply(
        `Assalomu alaykum!\n\nO'quv markazimizga xush kelibsiz.\nDavom etish uchun telefon raqamingizni ulashing:`,
        {
          reply_markup: {
            keyboard: [[{ text: 'Telefon raqamni ulashish', request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      );
    } catch (err) {
      console.error('Start xatolik:', err);
      ctx.reply('Xatolik yuz berdi. Qayta urinib ko\'ring.').catch(() => {});
    }
  });

  // Telefon raqam ulashilganda
  bot.on('contact', async (ctx) => {
    try {
      const contact = ctx.message.contact;
      const tgUser = ctx.from;
      const telegramId = BigInt(tgUser.id);

      // 1. Hodim sifatida ro'yxatdan o'tganmi?
      const existingStaff = await prisma.user.findFirst({
        where: { phone: contact.phone_number }
      });
      if (existingStaff) {
        await prisma.user.update({
          where: { id: existingStaff.id },
          data: { telegramId, username: tgUser.username || '' }
        });
        const url = existingStaff.role === 'teacher'
          ? `${process.env.MINI_APP_URL}/teacher.html`
          : `${process.env.MINI_APP_URL}/reception.html`;
        await ctx.reply('Tizimga kirish muvaffaqiyatli!', { reply_markup: { remove_keyboard: true } });
        return ctx.reply(`Ta'lim Plus botiga xush kelibsiz, ${existingStaff.firstName}!\n\nCRM tizimidan foydalanish uchun quyidagi tugmani bosing.`, {
          reply_markup: { inline_keyboard: [[{ text: '📊 CRM ni ochish', web_app: { url } }]] }
        });
      }

      // 2. O'quvchi yoki ota-onami?
      const applicant = await findApplicantByPhone(contact.phone_number);
      if (applicant) {
        // telegramId ni saqla
        await prisma.applicant.update({
          where: { id: applicant.id },
          data: { telegramId }
        });
        await ctx.reply('Telefon raqamingiz tasdiqlandi!', { reply_markup: { remove_keyboard: true } });
        return sendStudentWelcome(ctx, applicant);
      }

      // 3. Bazada yo'q — oddiy tashrif buyuruvchi
      await ctx.reply('Telefon raqamingiz qabul qilindi!', { reply_markup: { remove_keyboard: true } });
      const receptionistUsername = process.env.RECEPTIONIST_USERNAME || 'admin';
      return ctx.reply(
        `O'quv Markazimiz\n\nYuqori sifatli ta'lim xizmatlarimiz bilan tanishing.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Qabulga yozilish', web_app: { url: `${process.env.MINI_APP_URL}/public/enroll.html` } }],
              [{ text: 'Qabulxona bilan bog\'lanish', url: `https://t.me/${receptionistUsername}` }]
            ]
          }
        }
      );
    } catch (err) {
      console.error('Contact xatolik:', err);
      ctx.reply('Xatolik yuz berdi.').catch(() => {});
    }
  });

  // Boshqa xabarlar
  bot.on('message', async (ctx) => {
    try {
      const telegramId = BigInt(ctx.from.id);
      const adminId = BigInt(process.env.ADMIN_TELEGRAM_ID || '0');

      if (telegramId === adminId) {
        return ctx.reply('Admin panelni ochish:', {
          reply_markup: { inline_keyboard: [[{ text: 'Admin panelni ochish', web_app: { url: `${process.env.MINI_APP_URL}/admin.html` } }]] }
        });
      }

      // Hodim
      const user = await prisma.user.findUnique({ where: { telegramId } });
      if (user) {
        const url = user.role === 'teacher'
          ? `${process.env.MINI_APP_URL}/teacher.html`
          : `${process.env.MINI_APP_URL}/reception.html`;
        return ctx.reply('CRM tizimini ochish:', {
          reply_markup: { inline_keyboard: [[{ text: 'Ochish', web_app: { url } }]] }
        });
      }

      // O'quvchi/ota-ona
      const applicant = await prisma.applicant.findFirst({ where: { telegramId } });
      if (applicant) {
        return ctx.reply('Davom etish uchun /start bosing.');
      }

      ctx.reply('Iltimos /start bosing.');
    } catch (e) {
      console.error('Message xatolik:', e);
    }
  });
};
