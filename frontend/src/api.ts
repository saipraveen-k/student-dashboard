import axios from 'axios';

export const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !String(err.config?.url).includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.assign('/login');
    }
    return Promise.reject(err);
  },
);

export const errorMessage = (e: any) =>
  e?.response?.data?.error || e?.response?.data?.errors?.join(', ') || e?.message || 'Something went wrong';

export interface Student {
  id: number; roll_number: string; name: string; branch: string; section: string; email: string;
  semester_1_sgpa: number | null; semester_2_sgpa: number | null; cgpa: number | null;
}

export interface Summary {
  total_students: number; average_cgpa: number; pass_percentage: number; at_risk: number;
  highest_cgpa: number; lowest_cgpa: number;
}

export async function downloadCsv() {
  const res = await api.get('/analytics/export', { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'students_report.csv';
  a.click();
  URL.revokeObjectURL(url);
}
