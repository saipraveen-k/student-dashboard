import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { studentScope } from '../utils/access';
import { validateStudentRow } from '../utils/validation';

const router = Router();
router.use(authenticate);

// GET /api/students?search=&branch=&section=&minCgpa=&maxCgpa=&sort=cgpa&order=desc&page=1&limit=25
router.get('/', async (req: AuthRequest, res) => {
  const { search, branch, section, minCgpa, maxCgpa } = req.query as Record<string, string | undefined>;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 25));
  const sort = ['name', 'roll_number', 'cgpa', 'branch', 'section'].includes(String(req.query.sort))
    ? String(req.query.sort) : 'roll_number';
  const order = req.query.order === 'desc' ? 'desc' : 'asc';

  const filters: Prisma.StudentWhereInput[] = [await studentScope(req.user!)];
  if (search) filters.push({ OR: [
    { name: { contains: search, mode: 'insensitive' } },
    { roll_number: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ] });
  if (branch) filters.push({ branch: branch.toUpperCase() });
  if (section) filters.push({ section: section.toUpperCase() });
  if (minCgpa || maxCgpa) filters.push({ cgpa: {
    ...(minCgpa ? { gte: Number(minCgpa) } : {}),
    ...(maxCgpa ? { lte: Number(maxCgpa) } : {}),
  } });
  const where = { AND: filters };

  const [total, data] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({ where, orderBy: { [sort]: order }, skip: (page - 1) * limit, take: limit }),
  ]);
  res.json({ data, total, page, limit, pages: Math.ceil(total / limit) });
});

router.get('/me', async (req: AuthRequest, res) => {
  const student = await prisma.student.findUnique({
    where: { email: req.user!.email },
    include: { academic_sessions: { orderBy: { semester: 'asc' } } },
  });
  student ? res.json(student) : res.status(404).json({ error: 'No student record linked to this account' });
});

router.get('/:id', async (req: AuthRequest, res) => {
  const student = await prisma.student.findFirst({
    where: { AND: [{ id: Number(req.params.id) }, await studentScope(req.user!)] },
    include: { academic_sessions: { orderBy: { semester: 'asc' } } },
  });
  student ? res.json(student) : res.status(404).json({ error: 'Student not found' });
});

router.post('/', authorize('admin'), async (req, res) => {
  const { row, errors } = validateStudentRow(req.body ?? {});
  if (!row) return res.status(400).json({ errors });
  try {
    res.status(201).json(await prisma.student.create({ data: row }));
  } catch {
    res.status(409).json({ error: 'Roll number or email already exists' });
  }
});

router.put('/:id', authorize('admin'), async (req, res) => {
  const { row, errors } = validateStudentRow(req.body ?? {});
  if (!row) return res.status(400).json({ errors });
  try {
    res.json(await prisma.student.update({ where: { id: Number(req.params.id) }, data: row }));
  } catch {
    res.status(404).json({ error: 'Student not found' });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await prisma.student.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Student not found' });
  }
});

// Academic sessions (semester records) for a student
router.post('/:id/sessions', authorize('admin', 'faculty'), async (req: AuthRequest, res) => {
  const studentId = Number(req.params.id);
  const visible = await prisma.student.findFirst({ where: { AND: [{ id: studentId }, await studentScope(req.user!)] } });
  if (!visible) return res.status(404).json({ error: 'Student not found' });
  const { semester, sgpa, credits_completed, academic_year } = req.body ?? {};
  if (!semester || !academic_year) return res.status(400).json({ error: 'semester and academic_year are required' });
  const session = await prisma.academicSession.upsert({
    where: { student_id_semester_academic_year: { student_id: studentId, semester: Number(semester), academic_year } },
    update: { sgpa: sgpa ?? null, credits_completed: Number(credits_completed) || 0 },
    create: { student_id: studentId, semester: Number(semester), academic_year, sgpa: sgpa ?? null,
      credits_completed: Number(credits_completed) || 0 },
  });
  res.status(201).json(session);
});

export default router;
