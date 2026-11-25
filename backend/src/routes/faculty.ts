import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/my-sections', authorize('faculty'), async (req: AuthRequest, res) => {
  const assignments = await prisma.facultyAssignment.findMany({
    where: { faculty_id: req.user!.id },
    orderBy: [{ academic_year: 'desc' }, { branch: 'asc' }, { section: 'asc' }],
  });
  const withCounts = await Promise.all(assignments.map(async (a) => ({
    ...a,
    student_count: await prisma.student.count({ where: { branch: a.branch, section: a.section } }),
    at_risk_count: await prisma.student.count({ where: { branch: a.branch, section: a.section, cgpa: { lt: 6 } } }),
  })));
  res.json(withCounts);
});

router.get('/assignments', authorize('admin'), async (_req, res) => {
  res.json(await prisma.facultyAssignment.findMany({
    include: { faculty: { select: { id: true, email: true } } },
    orderBy: { id: 'asc' },
  }));
});

router.post('/assignments', authorize('admin'), async (req, res) => {
  const { faculty_id, branch, section, academic_year } = req.body ?? {};
  if (!faculty_id || !branch || !section || !academic_year) {
    return res.status(400).json({ error: 'faculty_id, branch, section and academic_year are required' });
  }
  const faculty = await prisma.user.findUnique({ where: { id: Number(faculty_id) } });
  if (faculty?.role !== 'faculty') return res.status(400).json({ error: 'faculty_id must belong to a faculty user' });
  try {
    res.status(201).json(await prisma.facultyAssignment.create({ data: {
      faculty_id: Number(faculty_id), branch: String(branch).toUpperCase(),
      section: String(section).toUpperCase(), academic_year: String(academic_year),
    } }));
  } catch {
    res.status(409).json({ error: 'This assignment already exists' });
  }
});

router.delete('/assignments/:id', authorize('admin'), async (req, res) => {
  try {
    await prisma.facultyAssignment.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Assignment not found' });
  }
});

export default router;
