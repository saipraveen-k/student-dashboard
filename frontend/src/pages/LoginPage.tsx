import { Alert, Box, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import { FormEvent, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { login } from '../store/authSlice';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = (e: FormEvent) => { e.preventDefault(); dispatch(login({ email, password })); };
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2, p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>EduInsight Engine</Typography>
          <Typography variant="body2" color="text.secondary">Sign in as admin, faculty or student</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" variant="contained" size="large" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
        </CardContent>
      </Card>
    </Box>
  );
}
