export interface StudentRow {
  roll_number: string;
  name: string;
  branch: string;
  section: string;
  email: string;
  semester_1_sgpa: number | null;
  semester_2_sgpa: number | null;
  cgpa: number | null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function num(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

/** Normalises a header like "Semester 1 SGPA" to "semester_1_sgpa". */
export function normaliseKey(k: string): string {
  return k.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function validateStudentRow(raw: Record<string, unknown>): { row?: StudentRow; errors: string[] } {
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = normaliseKey(k);
    const value = typeof v === 'string' ? v.trim() : v;
    // Never let an empty cell overwrite a filled one when two headers normalise to the same key
    if (value !== '' && value !== null && value !== undefined) r[key] = value;
    else if (!(key in r)) r[key] = value;
  }
  const errors: string[] = [];
  for (const f of ['roll_number', 'name', 'branch', 'section', 'email']) {
    if (!r[f]) errors.push(`${f} is required`);
  }
  if (r.email && !EMAIL.test(String(r.email))) errors.push('email is not valid');
  const s1 = num(r.semester_1_sgpa), s2 = num(r.semester_2_sgpa);
  let cgpa = num(r.cgpa);
  for (const [name, v] of [['semester_1_sgpa', s1], ['semester_2_sgpa', s2], ['cgpa', cgpa]] as const) {
    if (Number.isNaN(v)) errors.push(`${name} must be a number`);
    else if (v !== null && (v < 0 || v > 10)) errors.push(`${name} must be between 0 and 10`);
  }
  if (errors.length) return { errors };
  if (cgpa === null) {
    const known = [s1, s2].filter((x): x is number => x !== null);
    cgpa = known.length ? Number((known.reduce((a, b) => a + b, 0) / known.length).toFixed(2)) : null;
  }
  return {
    errors,
    row: {
      roll_number: String(r.roll_number).toUpperCase(),
      name: String(r.name),
      branch: String(r.branch).toUpperCase(),
      section: String(r.section).toUpperCase(),
      email: String(r.email).toLowerCase(),
      semester_1_sgpa: s1,
      semester_2_sgpa: s2,
      cgpa,
    },
  };
}
