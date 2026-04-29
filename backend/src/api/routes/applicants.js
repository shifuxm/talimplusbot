const router = require('express').Router();
const prisma = require('../../db');
const roleCheck = require('../middleware/roleCheck');

router.get('/', roleCheck('admin', 'receptionist'), async (req, res) => {
  const { search } = req.query;
  const where = { status: 'waiting' };
  if (search) where.OR = [
    { firstName: { contains: search, mode: 'insensitive' } },
    { lastName: { contains: search, mode: 'insensitive' } }
  ];
  const applicants = await prisma.applicant.findMany({
    where,
    include: { applicantSubjects: { include: { subject: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(applicants);
});

router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, educationType, grade, phoneSelf, phoneFather, phoneMother, subjectIds } = req.body;
    if (!firstName || !lastName || !educationType) return res.status(400).json({ error: 'Ism, familya, o\'qish joyi kerak' });
    if (!phoneSelf && !phoneFather && !phoneMother) return res.status(400).json({ error: 'Kamida bitta telefon kerak' });
    if (!subjectIds?.length) return res.status(400).json({ error: 'Kamida bitta fan tanlang' });

    const applicant = await prisma.applicant.create({
      data: {
        firstName, lastName, educationType, grade,
        phoneSelf, phoneFather, phoneMother,
        applicantSubjects: { create: subjectIds.map(id => ({ subjectId: parseInt(id) })) }
      },
      include: { applicantSubjects: { include: { subject: true } } }
    });
    res.json(applicant);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/enroll', roleCheck('admin', 'receptionist'), async (req, res) => {
  try {
    const { groupAssignments } = req.body;
    const applicantId = parseInt(req.params.id);

    let student = await prisma.student.findUnique({ where: { applicantId } });
    if (!student) student = await prisma.student.create({ data: { applicantId } });

    for (const { groupId } of groupAssignments) {
      await prisma.groupStudent.upsert({
        where: { groupId_studentId: { groupId: parseInt(groupId), studentId: student.id } },
        update: { status: 'active' },
        create: { groupId: parseInt(groupId), studentId: student.id }
      });
    }

    if (groupAssignments.length > 0) {
      await prisma.applicant.update({ where: { id: applicantId }, data: { status: 'enrolled' } });
    }

    res.json({ success: true, studentId: student.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', roleCheck('admin', 'receptionist'), async (req, res) => {
  await prisma.applicant.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

module.exports = router;
