import { Alert, Box, Card, MenuItem, Pagination, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Student } from '../api';
import StudentTable from '../components/StudentTable';
import { useFetch } from '../components/useFetch';

interface Page { data: Student[]; total: number; pages: number }

export default function StudentsPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      search ? next.set('search', search) : next.delete('search');
      next.set('page', '1');
      if (next.toString() !== params.toString()) setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setParams(next);
  };
  const query = new URLSearchParams(params);
  if (!query.get('sort')) { query.set('sort', 'cgpa'); query.set('order', 'desc'); }
  const { data, error } = useFetch<Page>(`/students?${query.toString()}`);

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Students</Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <TextField size="small" label="Search name, roll no. or email" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }} />
        <TextField size="small" select label="Branch" value={params.get('branch') ?? ''} onChange={(e) => set('branch', e.target.value)} sx={{ width: 120 }}>
          {['', 'CSE', 'ECE', 'ME', 'CE'].map((b) => <MenuItem key={b} value={b}>{b || 'All'}</MenuItem>)}
        </TextField>
        <TextField size="small" label="Section" value={params.get('section') ?? ''} onChange={(e) => set('section', e.target.value)} sx={{ width: 100 }} />
        <TextField size="small" type="number" label="Min CGPA" value={params.get('minCgpa') ?? ''} onChange={(e) => set('minCgpa', e.target.value)} sx={{ width: 110 }} />
        <TextField size="small" type="number" label="Max CGPA" value={params.get('maxCgpa') ?? ''} onChange={(e) => set('maxCgpa', e.target.value)} sx={{ width: 110 }} />
        <TextField size="small" select label="Sort by" value={query.get('sort')} onChange={(e) => set('sort', e.target.value)} sx={{ width: 140 }}>
          {[['cgpa', 'CGPA'], ['name', 'Name'], ['roll_number', 'Roll no.']].map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </TextField>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      <Card variant="outlined">
        <StudentTable rows={data?.data ?? []} />
      </Card>
      {data && data.pages > 1 && (
        <Pagination sx={{ mt: 2 }} count={data.pages} page={Number(params.get('page') || 1)} onChange={(_, p) => set('page', String(p))} />
      )}
      {data && <Typography variant="caption" color="text.secondary">{data.total} students</Typography>}
    </>
  );
}
