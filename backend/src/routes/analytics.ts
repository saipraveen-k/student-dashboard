import { Router } from 'express';
import { Student } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { studentScope } from '../utils/access';

const router = Router();
router.use(authenticate);

export const PASS_CGPA = 5.0;
const BUCKETS = [
  { label: '< 5', min: 0, max: 5 }, { label: '5-6', min: 5, max: 6 }, { label: '6-7', min: 6, max: 7 },
  { label: '7-8', min: 7, max: 8 }, { label: '8-9', min: 8, max: 9 }, { label: '9-10', min: 9, max: 10.01 },
];

const round = (n: number) => Math.round(n * 100) / 100;
const avg = (xs: number[]) => (xs.length ? round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
const cgpas = (s: Student[]) => s.map((x) => x.cgpa).filter((c): c is number => c !== null);

export function summarise(students: Student[]) {
  const c = cgpas(students);
  return {
    total_students: students.length,
    average_cgpa: avg(c),
    pass_percentage: c.length ? round((c.filter((x) => x >= PASS_CGPA).length / c.length) * 100) : 0,
    at_risk: c.filter((x) => x < 6).length,
    highest_cgpa: c.length ? Math.max(...c) : 0,
    lowest_cgpa: c.length ? Math.min(...c) : 0,
  };
}

function groupBy(students: Student[], key: (s: Student) => string) {
  const groups = new Map<string, Student[]>();
  for (const s of students) groups.set(key(s), [...(groups.get(key(s)) ?? []), s]);
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, list]) => ({ name, ...summarise(list) }));
}

async function scoped(req: AuthRequest) {
  return prisma.student.findMany({ where: await studentScope(req.user!) });
}

router.get('/overview', authorize('admin', 'faculty'), async (req: AuthRequest, res) => {
  const students = await scoped(req);
  const c = cgpas(students);
  res.json({
    ...summarise(students),
    distribution: BUCKETS.map((b) => ({ range: b.label, count: c.filter((x) => x >= b.min && x < b.max).length })),
    top_performers: [...students].filter((s) => s.cgpa !== null).sort((a, b) => b.cgpa! - a.cgpa!).slice(0, 5),
    at_risk_students: students.filter((s) => s.cgpa !== null && s.cgpa < 6).sort((a, b) => a.cgpa! - b.cgpa!).slice(0, 10),
  });
});

router.get('/branches', authorize('admin', 'faculty'), async (req: AuthRequest, res) => {
  res.json(groupBy(await scoped(req), (s) => s.branch));
});

router.get('/sections', authorize('admin', 'faculty'), async (req: AuthRequest, res) => {
  const branch = (req.query.branch as string | undefined)?.toUpperCase();
  const students = (await scoped(req)).filter((s) => !branch || s.branch === branch);
  res.json(groupBy(students, (s) => `${s.branch}-${s.section}`));
});

// Compare chosen branches: /compare?branches=CSE,ECE
router.get('/compare', authorize('admin', 'faculty'), async (req: AuthRequest, res) => {
  const wanted = String(req.query.branches ?? '').split(',').map((b) => b.trim().toUpperCase()).filter(Boolean);
  const students = (await scoped(req)).filter((s) => !wanted.length || wanted.includes(s.branch));
  const byBranch = groupBy(students, (s) => s.branch);
  res.json(byBranch.map((b) => {
    const list = students.filter((s) => s.branch === b.name);
    return {
      ...b,
      semester_1_avg: avg(list.map((s) => s.semester_1_sgpa).filter((x): x is number => x !== null)),
      semester_2_avg: avg(list.map((s) => s.semester_2_sgpa).filter((x): x is number => x !== null)),
    };
  }));
});

// Semester-over-semester average SGPA, optionally per branch
router.get('/trends', authorize('admin', 'faculty'), async (req: AuthRequest, res) => {
  const students = await scoped(req);
  const ids = students.map((s) => s.id);
  const sessions = await prisma.academicSession.findMany({ where: { student_id: { in: ids } } });
  const branchOf = new Map(students.map((s) => [s.id, s.branch]));
  const bySem = new Map<number, number[]>();
  const bySemBranch = new Map<string, number[]>();
  const push = (m: Map<any, number[]>, k: any, v: number) => m.set(k, [...(m.get(k) ?? []), v]);
  for (const s of sessions) if (s.sgpa !== null) {
    push(bySem, s.semester, s.sgpa);
    push(bySemBranch, `${branchOf.get(s.student_id)}|${s.semester}`, s.sgpa);
  }
  // Fall back to the semester_1/2 columns when no session rows exist
  if (sessions.length === 0) for (const s of students) {
    if (s.semester_1_sgpa !== null) { push(bySem, 1, s.semester_1_sgpa); push(bySemBranch, `${s.branch}|1`, s.semester_1_sgpa); }
    if (s.semester_2_sgpa !== null) { push(bySem, 2, s.semester_2_sgpa); push(bySemBranch, `${s.branch}|2`, s.semester_2_sgpa); }
  }
  const semesters = [...bySem.keys()].sort((a, b) => a - b);
  const branches = [...new Set(students.map((s) => s.branch))].sort();
  res.json({
    semesters,
    overall: semesters.map((sem) => avg(bySem.get(sem)!)),
    by_branch: branches.map((b) => ({ branch: b, values: semesters.map((sem) => avg(bySemBranch.get(`${b}|${sem}`) ?? [])) })),
  });
});

// A student's own progression and standing (students may only see themselves)
async function studentReport(studentId: number) {
  const student = await prisma.student.findUnique({
    where: { id: studentId }, include: { academic_sessions: { orderBy: { semester: 'asc' } } },
  });
  if (!student) return null;
  const peers = await prisma.student.findMany({
    where: { branch: student.branch, section: student.section, cgpa: { not: null } }, select: { cgpa: true },
  });
  const branchPeers = await prisma.student.findMany({
    where: { branch: student.branch, cgpa: { not: null } }, select: { cgpa: true },
  });
  const rankIn = (list: { cgpa: number | null }[]) =>
    student.cgpa === null ? null : 1 + list.filter((p) => p.cgpa! > student.cgpa!).length;
  const progression = student.academic_sessions.length
    ? student.academic_sessions.map((s) => ({ semester: s.semester, sgpa: s.sgpa }))
    : [{ semester: 1, sgpa: student.semester_1_sgpa }, { semester: 2, sgpa: student.semester_2_sgpa }].filter((p) => p.sgpa !== null);
  return {
    student,
    progression,
    section_rank: rankIn(peers),
    section_size: peers.length,
    branch_rank: rankIn(branchPeers),
    branch_size: branchPeers.length,
    section_average: avg(peers.map((p) => p.cgpa!)),
    standing: student.cgpa === null ? 'No data' : student.cgpa >= 8 ? 'Distinction'
      : student.cgpa >= 6.5 ? 'First class' : student.cgpa >= PASS_CGPA ? 'Pass' : 'At risk',
  };
}

router.get('/me', authorize('student'), async (req: AuthRequest, res) => {
  const me = await prisma.student.findUnique({ where: { email: req.user!.email } });
  if (!me) return res.status(404).json({ error: 'No student record linked to this account' });
  res.json(await studentReport(me.id));
});

router.get('/student/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const visible = await prisma.student.findFirst({ where: { AND: [{ id }, await studentScope(req.user!)] } });
  if (!visible) return res.status(404).json({ error: 'Student not found' });
  res.json(await studentReport(id));
});

// Ranking within the caller's scope: /rankings?branch=CSE&section=A&limit=20
router.get('/rankings', authorize('admin', 'faculty'), async (req: AuthRequest, res) => {
  const branch = (req.query.branch as string | undefined)?.toUpperCase();
  const section = (req.query.section as string | undefined)?.toUpperCase();
  const limit = Math.min(500, Number(req.query.limit) || 20);
  const ranked = (await scoped(req))
    .filter((s) => s.cgpa !== null && (!branch || s.branch === branch) && (!section || s.section === section))
    .sort((a, b) => b.cgpa! - a.cgpa!);
  res.json(ranked.slice(0, limit).map((s, i) => ({ rank: i + 1, ...s })));
});

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

router.get('/export', authorize('admin', 'faculty'), async (req: AuthRequest, res) => {
  const students = (await scoped(req)).sort((a, b) => a.roll_number.localeCompare(b.roll_number));
  const cols = ['roll_number', 'name', 'branch', 'section', 'email', 'semester_1_sgpa', 'semester_2_sgpa', 'cgpa'] as const;
  const csv = [cols.join(','), ...students.map((s) => cols.map((c) => csvCell(s[c])).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="students_report.csv"');
  res.send(csv);
});

export default router;
