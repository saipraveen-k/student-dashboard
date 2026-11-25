import { Alert, CircularProgress } from '@mui/material';
import { useFetch } from '../components/useFetch';
import StudentReport, { Report } from './StudentReport';

export default function StudentDashboard() {
  const { data, error, loading } = useFetch<Report>('/analytics/me');
  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  return <StudentReport r={data!} />;
}
