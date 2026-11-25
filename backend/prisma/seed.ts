import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BRANCHES = ['CSE', 'ECE', 'ME', 'CE'];
const SECTIONS = ['A', 'B'];
const FIRST = ['Aarav', 'Diya', 'Kiran', 'Meera', 'Rahul', 'Sneha', 'Vikram', 'Ananya', 'Rohit', 'Priya', 'Arjun', 'Kavya'];
const LAST = ['Reddy', 'Sharma', 'Naidu', 'Rao', 'Iyer', 'Varma', 'Kumar', 'Patel'];

// Deterministic pseudo-random numbers so every seed run gives the same data
let state = 42;
const rand = () => ((state = (state * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const sgpa = (base: number) => Math.min(10, Math.max(3.5, Math.round((base + (rand() - 0.5) * 2) * 100) / 100));

async function main() {
  const password = await bcrypt.hash('Password@123', 10);
  await prisma.user.upsert({ where: { email: 'admin@college.edu' }, update: {},
    create: { email: 'admin@college.edu', password_hash: password, role: 'admin' } });
  const faculty = await prisma.user.upsert({ where: { email: 'faculty@college.edu' }, update: {},
    create: { email: 'faculty@college.edu', password_hash: password, role: 'faculty' } });
  for (const section of SECTIONS) {
    await prisma.facultyAssignment.upsert({
      where: { faculty_id_branch_section_academic_year: { faculty_id: faculty.id, branch: 'CSE', section, academic_year: '2025-26' } },
      update: {}, create: { faculty_id: faculty.id, branch: 'CSE', section, academic_year: '2025-26' },
    });
  }

  let n = 0;
  for (const branch of BRANCHES) for (const section of SECTIONS) for (let i = 1; i <= 12; i++) {
    n++;
    const roll = `22${branch}${section}${String(i).padStart(3, '0')}`;
    const base = 5 + rand() * 4.5;
    const s1 = sgpa(base), s2 = sgpa(base + 0.2);
    const email = n === 1 ? 'student@college.edu' : `${roll.toLowerCase()}@college.edu`;
    const student = await prisma.student.upsert({ where: { roll_number: roll }, update: {}, create: {
      roll_number: roll, email, branch, section,
      name: `${FIRST[n % FIRST.length]} ${LAST[(n * 7) % LAST.length]}`,
      semester_1_sgpa: s1, semester_2_sgpa: s2, cgpa: Math.round(((s1 + s2) / 2) * 100) / 100,
    } });
    for (const [semester, value] of [[1, s1], [2, s2], [3, sgpa(base + 0.1)]] as const) {
      await prisma.academicSession.upsert({
        where: { student_id_semester_academic_year: { student_id: student.id, semester, academic_year: semester < 3 ? '2024-25' : '2025-26' } },
        update: {}, create: { student_id: student.id, semester, sgpa: value, credits_completed: 20,
          academic_year: semester < 3 ? '2024-25' : '2025-26' },
      });
    }
  }
  await prisma.user.upsert({ where: { email: 'student@college.edu' }, update: {},
    create: { email: 'student@college.edu', password_hash: password, role: 'student' } });
  console.log(`Seeded ${n} students. Logins (password Password@123): admin@college.edu, faculty@college.edu, student@college.edu`);
}

main().finally(() => prisma.$disconnect());
