import { Chip, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Student } from '../api';

export const cgpaColor = (c: number | null) => (c === null ? 'default' : c >= 8 ? 'success' : c >= 6 ? 'primary' : 'error');

export default function StudentTable({ rows, rank }: { rows: (Student & { rank?: number })[]; rank?: boolean }) {
  const navigate = useNavigate();
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {rank && <TableCell>#</TableCell>}
          <TableCell>Roll no.</TableCell><TableCell>Name</TableCell><TableCell>Branch</TableCell>
          <TableCell>Section</TableCell><TableCell align="right">CGPA</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((s) => (
          <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/students/${s.id}`)}>
            {rank && <TableCell>{s.rank}</TableCell>}
            <TableCell>{s.roll_number}</TableCell><TableCell>{s.name}</TableCell>
            <TableCell>{s.branch}</TableCell><TableCell>{s.section}</TableCell>
            <TableCell align="right"><Chip size="small" color={cgpaColor(s.cgpa) as any} label={s.cgpa ?? '—'} /></TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && <TableRow><TableCell colSpan={6} align="center">No students</TableCell></TableRow>}
      </TableBody>
    </Table>
  );
}
