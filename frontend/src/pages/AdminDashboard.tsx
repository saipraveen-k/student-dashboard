import { Alert, Button, CircularProgress, Grid, Typography } from '@mui/material';
import { Bar, Line } from 'react-chartjs-2';
import { downloadCsv, Student, Summary } from '../api';
import MetricCard from '../components/MetricCard';
import Panel from '../components/Panel';
import StudentTable from '../components/StudentTable';
import { useFetch } from '../components/useFetch';

export interface Overview extends Summary {
  distribution: { range: string; count: number }[];
  top_performers: Student[];
  at_risk_students: Student[];
}
type Group = Summary & { name: string };
interface Trends { semesters: number[]; overall: number[]; by_branch: { branch: string; values: number[] }[] }

const COLORS = ['#1e3a8a', '#0891b2', '#d97706', '#16a34a', '#9333ea', '#dc2626'];

export function KpiRow({ o }: { o: Summary }) {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={6} md={3}><MetricCard label="Total students" value={o.total_students} /></Grid>
      <Grid item xs={6} md={3}><MetricCard label="Average CGPA" value={o.average_cgpa.toFixed(2)} /></Grid>
      <Grid item xs={6} md={3}><MetricCard label="Pass percentage" value={`${o.pass_percentage}%`} hint="CGPA ≥ 5.0" /></Grid>
      <Grid item xs={6} md={3}><MetricCard label="At-risk students" value={o.at_risk} hint="CGPA below 6.0" /></Grid>
    </Grid>
  );
}

export function DistributionChart({ o }: { o: Overview }) {
  return <Bar data={{ labels: o.distribution.map((d) => d.range),
    datasets: [{ label: 'Students', data: o.distribution.map((d) => d.count), backgroundColor: '#0891b2' }] }}
    options={{ plugins: { legend: { display: false } } }} />;
}

export function TrendChart({ t }: { t: Trends }) {
  return <Line data={{ labels: t.semesters.map((s) => `Sem ${s}`), datasets: [
    { label: 'All', data: t.overall, borderColor: '#111827', borderDash: [6, 4] },
    ...t.by_branch.map((b, i) => ({ label: b.branch, data: b.values, borderColor: COLORS[i % COLORS.length] })),
  ] }} options={{ scales: { y: { suggestedMin: 5, suggestedMax: 10 } } }} />;
}

export default function AdminDashboard() {
  const overview = useFetch<Overview>('/analytics/overview');
  const branches = useFetch<Group[]>('/analytics/branches');
  const trends = useFetch<Trends>('/analytics/trends');
  if (overview.loading) return <CircularProgress />;
  if (overview.error) return <Alert severity="error">{overview.error}</Alert>;
  const o = overview.data!;
  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        College overview
        <span><Button onClick={() => downloadCsv()}>Export CSV</Button><Button onClick={() => window.print()}>Print / PDF</Button></span>
      </Typography>
      <KpiRow o={o} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Panel title="Branch comparison">
            {branches.data && <Bar data={{ labels: branches.data.map((b) => b.name), datasets: [
              { label: 'Average CGPA', data: branches.data.map((b) => b.average_cgpa), backgroundColor: '#1e3a8a', yAxisID: 'y' },
              { label: 'Pass %', data: branches.data.map((b) => b.pass_percentage), backgroundColor: '#d97706', yAxisID: 'y1' },
            ] }} options={{ scales: { y: { min: 0, max: 10 }, y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false } } } }} />}
          </Panel>
        </Grid>
        <Grid item xs={12} md={5}><Panel title="CGPA distribution"><DistributionChart o={o} /></Panel></Grid>
        <Grid item xs={12}><Panel title="Semester trend (average SGPA)">{trends.data && <TrendChart t={trends.data} />}</Panel></Grid>
        <Grid item xs={12} md={6}><Panel title="Top performers"><StudentTable rows={o.top_performers} /></Panel></Grid>
        <Grid item xs={12} md={6}><Panel title="Students needing attention"><StudentTable rows={o.at_risk_students} /></Panel></Grid>
      </Grid>
    </>
  );
}
