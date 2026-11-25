import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuthUser } from '../middleware/auth';

/**
 * Builds the Prisma filter limiting which students a user may see:
 *  - admin:   everyone
 *  - faculty: only students in sections assigned to them
 *  - student: only their own record (matched by email)
 */
export async function studentScope(user: AuthUser): Promise<Prisma.StudentWhereInput> {
  if (user.role === 'admin') return {};
  if (user.role === 'student') return { email: user.email };
  const assignments = await prisma.facultyAssignment.findMany({
    where: { faculty_id: user.id },
    select: { branch: true, section: true },
  });
  if (assignments.length === 0) return { id: -1 };
  return { OR: assignments.map((a) => ({ branch: a.branch, section: a.section })) };
}
