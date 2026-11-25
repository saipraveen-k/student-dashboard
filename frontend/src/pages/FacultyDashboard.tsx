import { Alert, Button, Card, CardActionArea, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { downloadCsv } from '../api';
import Panel from '../components/Panel';
import StudentTable from '../components/StudentTable';
import { useFetch } from '../components/useFetch';
import { DistributionChart, KpiRow, Overview } from './AdminDashboard';

interface Assignment { id: number; branch: string; section: string; academic_year: string; student_count: number; at_risk_count: number }

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const sections = useFetch<Assignment[]>('/faculty/my-sections');
  const overview = useFetch<Overview>('/analytics/overview');
  if (sections.loading || overview.loading) return <CircularProgress />;
  if (sections.error || overview.error) return <Alert severity="error">{sections.error || overview.error}</Alert>;
  if (!sections.data!.length) return <Alert severity="info">No sections are assigned to you yet. Ask an administrator.</Alert>;
  const o = overview.data!;
  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        My sections <Button onClick={() => downloadCsv()}>Export CSV</Button>
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {sections.data!.map((a) => (
          <Grid item xs={12} sm={6} md={3} key={a.id}>
            <Card variant="outlined">
              <CardActionArea onClick={() => navigate(`/students?branch=${a.branch}&section=${a.section}`)}>
                <CardContent>
                  <Typography variant="h6">{a.branch} – {a.section}</Typography>
                  <Typography variant="body2" color="text.secondary">{a.academic_year}</Typography>
                  <Typography variant="body2">{a.student_count} students · {a.at_risk_count} at risk</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      <KpiRow o={o} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}><Panel title="CGPA distribution"><DistributionChart o={o} /></Panel></Grid>
        <Grid item xs={12} md={7}><Panel title="Student alerts (CGPA below 6)"><StudentTable rows={o.at_risk_students} /></Panel></Grid>
      </Grid>
    </>
  );
}
