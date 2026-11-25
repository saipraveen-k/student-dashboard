import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate, authorize('admin'));

const publicFields = { id: true, email: true, role: true, created_at: true, updated_at: true };

router.get('/', async (req, res) => {
  const role = req.query.role as string | undefined;
  res.json(await prisma.user.findMany({
    where: role ? { role: role as any } : {},
    select: publicFields,
    orderBy: { id: 'asc' },
  }));
});

router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) }, select: publicFields });
  user ? res.json(user) : res.status(404).json({ error: 'User not found' });
});

router.put('/:id', async (req, res) => {
  const { email, password, role } = req.body ?? {};
  const data: Record<string, unknown> = {};
  if (email) data.email = String(email).toLowerCase();
  if (role) data.role = role;
  if (password) data.password_hash = await bcrypt.hash(String(password), 10);
  try {
    res.json(await prisma.user.update({ where: { id: Number(req.params.id) }, data, select: publicFields }));
  } catch {
    res.status(404).json({ error: 'User not found' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'User not found' });
  }
});

export default router;
