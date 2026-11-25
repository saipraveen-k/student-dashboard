import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useAppSelector } from './store';
import { Role } from './store/authSlice';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import ImportPage from './pages/ImportPage';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import StudentsPage from './pages/StudentsPage';

export const homeFor = (role: Role) => ({ admin: '/admin', faculty: '/faculty', student: '/me' }[role]);

function Protected({ roles, children }: { roles: Role[]; children: JSX.Element }) {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const user = useAppSelector((s) => s.auth.user);
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={homeFor(user.role)} replace /> : <LoginPage />} />
      <Route path="/admin" element={<Protected roles={['admin']}><AdminDashboard /></Protected>} />
      <Route path="/faculty" element={<Protected roles={['faculty']}><FacultyDashboard /></Protected>} />
      <Route path="/me" element={<Protected roles={['student']}><StudentDashboard /></Protected>} />
      <Route path="/students" element={<Protected roles={['admin', 'faculty']}><StudentsPage /></Protected>} />
      <Route path="/students/:id" element={<Protected roles={['admin', 'faculty']}><StudentProfile /></Protected>} />
      <Route path="/import" element={<Protected roles={['admin']}><ImportPage /></Protected>} />
      <Route path="*" element={<Navigate to={user ? homeFor(user.role) : '/login'} replace />} />
    </Routes>
  );
}
