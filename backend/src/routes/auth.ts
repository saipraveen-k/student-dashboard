import { Router } from 'express';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest, signToken } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const payload = { id: user.id, email: user.email, role: user.role };
  res.json({ token: signToken(payload), user: payload });
});

// Only admins create accounts (students and faculty are onboarded by the college).
router.post('/register', authenticate, authorize('admin'), async (req, res) => {
  const { email, password, role } = req.body ?? {};
  if (!email || !password || !Object.values(Role).includes(role)) {
    return res.status(400).json({ error: 'email, password and a valid role are required' });
  }
  if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const exists = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (exists) return res.status(409).json({ error: 'A user with this email already exists' });
  const user = await prisma.user.create({
    data: { email: String(email).toLowerCase(), password_hash: await bcrypt.hash(String(password), 10), role },
    select: { id: true, email: true, role: true, created_at: true },
  });
  res.status(201).json(user);
});

router.get('/me', authenticate, (req: AuthRequest, res) => res.json(req.user));

export default router;
