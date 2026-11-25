import { Card, CardContent, Typography } from '@mui/material';
import { ReactNode } from 'react';

export default function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title}{action}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}
