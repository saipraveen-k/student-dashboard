import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, errorMessage } from '../api';

export type Role = 'admin' | 'faculty' | 'student';
export interface User { id: number; email: string; role: Role }
interface AuthState { user: User | null; token: string | null; loading: boolean; error: string | null }

const stored = localStorage.getItem('user');
const initialState: AuthState = {
  user: stored ? JSON.parse(stored) : null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
};

export const login = createAsyncThunk('auth/login', async (body: { email: string; password: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', body);
    return data as { token: string; user: User };
  } catch (e) {
    return rejectWithValue(errorMessage(e));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(login.fulfilled, (s, a) => {
      s.loading = false; s.user = a.payload.user; s.token = a.payload.token;
      localStorage.setItem('token', a.payload.token);
      localStorage.setItem('user', JSON.stringify(a.payload.user));
    });
    b.addCase(login.rejected, (s, a) => { s.loading = false; s.error = String(a.payload ?? 'Login failed'); });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
