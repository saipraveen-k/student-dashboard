import { Alert, Button, CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useFetch } from '../components/useFetch';
import StudentReport, { Report } from './StudentReport';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, loading } = useFetch<Report>(`/analytics/student/${id}`);
  return (
    <>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>← Back</Button>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : <StudentReport r={data!} />}
    </>
  );
}
