import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/authSlice';

export default function Layout({ children }: { children: ReactNode }) {
  const user = useAppSelector((s) => s.auth.user)!;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const links = {
    admin: [['Dashboard', '/admin'], ['Students', '/students'], ['Import', '/import']],
    faculty: [['Dashboard', '/faculty'], ['Students', '/students']],
    student: [['My performance', '/me']],
  }[user.role];
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>EduInsight Engine</Typography>
          {links.map(([label, to]) => (
            <Button key={to} color="inherit" component={RouterLink} to={to}>{label}</Button>
          ))}
          <Typography variant="body2" sx={{ opacity: 0.8, display: { xs: 'none', sm: 'block' } }}>
            {user.email} · {user.role}
          </Typography>
          <Button color="inherit" onClick={() => { dispatch(logout()); navigate('/login'); }}>Log out</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>{children}</Container>
    </Box>
  );
}
