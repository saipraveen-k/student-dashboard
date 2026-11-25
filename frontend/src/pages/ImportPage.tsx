import { Alert, Box, Button, FormControlLabel, LinearProgress, Switch, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useState } from 'react';
import { api, errorMessage } from '../api';
import Panel from '../components/Panel';

interface Result {
  total_rows: number; valid_rows: number; created: number; updated: number; failed: number; dry_run: boolean;
  errors: { row: number; errors: string[] }[];
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = async () => {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    setError(null); setResult(null); setProgress(0);
    try {
      const { data } = await api.post<Result>(`/import/students?dryRun=${dryRun}`, form, {
        onUploadProgress: (e) => setProgress(e.total ? Math.round((e.loaded / e.total) * 100) : null),
      });
      setResult(data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setProgress(null);
    }
  };

  const template = async () => {
    const res = await api.get('/import/template', { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(res.data);
    a.download = 'student_import_template.xlsx';
    a.click();
  };

  return (
    <Panel title="Import students from Excel" action={<Button onClick={template}>Download template</Button>}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Columns: roll_number, name, branch, section, email, semester_1_sgpa, semester_2_sgpa, cgpa.
        Existing students (same roll number) are updated.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="outlined" component="label">
          {file ? file.name : 'Choose .xlsx / .csv file'}
          <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Button>
        <FormControlLabel control={<Switch checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />} label="Validate only (dry run)" />
        <Button variant="contained" disabled={!file || progress !== null} onClick={upload}>{dryRun ? 'Validate' : 'Import'}</Button>
      </Box>
      {progress !== null && <LinearProgress sx={{ mt: 2 }} variant={progress ? 'determinate' : 'indeterminate'} value={progress} />}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {result && (
        <Box sx={{ mt: 2 }}>
          <Alert severity={result.failed ? 'warning' : 'success'}>
            {result.dry_run ? 'Validation finished' : 'Import finished'}: {result.total_rows} rows, {result.valid_rows} valid
            {!result.dry_run && `, ${result.created} created, ${result.updated} updated`}, {result.failed} with errors.
          </Alert>
          {result.errors.length > 0 && (
            <Table size="small" sx={{ mt: 2 }}>
              <TableHead><TableRow><TableCell>Row</TableCell><TableCell>Problem</TableCell></TableRow></TableHead>
              <TableBody>{result.errors.map((e) => (
                <TableRow key={e.row}><TableCell>{e.row}</TableCell><TableCell>{e.errors.join('; ')}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          )}
        </Box>
      )}
    </Panel>
  );
}
