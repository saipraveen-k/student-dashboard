import { Chip, Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Student } from '../api';
import MetricCard from '../components/MetricCard';
import Panel from '../components/Panel';

export interface Report {
  student: Student & { academic_sessions: { id: number; semester: number; sgpa: number | null; academic_year: string; credits_completed: number }[] };
  progression: { semester: number; sgpa: number | null }[];
  section_rank: number | null; section_size: number;
  branch_rank: number | null; branch_size: number;
  section_average: number; standing: string;
}

export default function StudentReport({ r }: { r: Report }) {
  const s = r.student;
  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>{s.name}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {s.roll_number} · {s.branch} – Section {s.section} · {s.email} <Chip size="small" label={r.standing} sx={{ ml: 1 }} />
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}><MetricCard label="CGPA" value={s.cgpa ?? '—'} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Section rank" value={r.section_rank ? `${r.section_rank} / ${r.section_size}` : '—'} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Branch rank" value={r.branch_rank ? `${r.branch_rank} / ${r.branch_size}` : '—'} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Section average" value={r.section_average.toFixed(2)} /></Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Panel title="SGPA progression">
            <Line data={{ labels: r.progression.map((p) => `Sem ${p.semester}`), datasets: [
              { label: 'SGPA', data: r.progression.map((p) => p.sgpa), borderColor: '#1e3a8a', tension: 0.3 },
              { label: 'Section average CGPA', data: r.progression.map(() => r.section_average), borderColor: '#d97706', borderDash: [6, 4] },
            ] }} options={{ scales: { y: { suggestedMin: 4, suggestedMax: 10 } } }} />
          </Panel>
        </Grid>
        <Grid item xs={12} md={5}>
          <Panel title="Semester breakdown">
            <Table size="small">
              <TableHead><TableRow><TableCell>Semester</TableCell><TableCell>Year</TableCell><TableCell>Credits</TableCell><TableCell align="right">SGPA</TableCell></TableRow></TableHead>
              <TableBody>
                {s.academic_sessions.length ? s.academic_sessions.map((a) => (
                  <TableRow key={a.id}><TableCell>{a.semester}</TableCell><TableCell>{a.academic_year}</TableCell>
                    <TableCell>{a.credits_completed}</TableCell><TableCell align="right">{a.sgpa ?? '—'}</TableCell></TableRow>
                )) : r.progression.map((p) => (
                  <TableRow key={p.semester}><TableCell>{p.semester}</TableCell><TableCell>—</TableCell><TableCell>—</TableCell>
                    <TableCell align="right">{p.sgpa ?? '—'}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </Grid>
      </Grid>
    </>
  );
}
