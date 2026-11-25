import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validateStudentRow } from '../utils/validation';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /\.(xlsx|xls|csv)$/i.test(file.originalname)),
});

router.use(authenticate, authorize('admin'));

/**
 * POST /api/import/students  (multipart, field "file")
 * Columns: roll_number, name, branch, section, email, semester_1_sgpa, semester_2_sgpa, cgpa
 * ?dryRun=true validates without writing.
 */
router.post('/students', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Upload an .xlsx, .xls or .csv file in the "file" field' });
  let rows: Record<string, unknown>[];
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  } catch {
    return res.status(400).json({ error: 'Could not read the spreadsheet' });
  }
  const dryRun = req.query.dryRun === 'true';
  const errors: { row: number; errors: string[] }[] = [];
  let created = 0, updated = 0;
  const seen = new Set<string>();

  for (const [i, raw] of rows.entries()) {
    const line = i + 2; // header is row 1
    const { row, errors: rowErrors } = validateStudentRow(raw);
    if (!row) { errors.push({ row: line, errors: rowErrors }); continue; }
    if (seen.has(row.roll_number)) { errors.push({ row: line, errors: ['duplicate roll_number in file'] }); continue; }
    seen.add(row.roll_number);
    if (dryRun) continue;
    try {
      const existing = await prisma.student.findUnique({ where: { roll_number: row.roll_number } });
      await prisma.student.upsert({ where: { roll_number: row.roll_number }, update: row, create: row });
      existing ? updated++ : created++;
    } catch (e) {
      errors.push({ row: line, errors: ['database error (email may belong to another student)'] });
    }
  }
  res.json({ total_rows: rows.length, valid_rows: seen.size, created, updated, failed: errors.length, dry_run: dryRun, errors });
});

router.get('/template', (_req, res) => {
  const ws = XLSX.utils.json_to_sheet([{ roll_number: '22CSE001', name: 'Sample Student', branch: 'CSE', section: 'A',
    email: 'sample@college.edu', semester_1_sgpa: 8.2, semester_2_sgpa: 8.6, cgpa: 8.4 }]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  res.setHeader('Content-Disposition', 'attachment; filename="student_import_template.xlsx"');
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
});

export default router;
