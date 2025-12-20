import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { _get, _delete } from '../../helper/apiClient';

export const fetchCallLogs = createAsyncThunk(
  'callLogs/fetchCallLogs',
  async ({ page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await _get(`/call-logs/my-logs?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteCallLog = createAsyncThunk(
  'callLogs/deleteCallLog',
  async (callLogId, { rejectWithValue }) => {
    try {
      await _delete(`/call-logs/${callLogId}`);
      return callLogId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const callLogSlice = createSlice({
  name: 'callLogs',
  initialState: {
    logs: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pages: 1,
  },
  reducers: {
    addCallLog: (state, action) => {
      state.logs.unshift(action.payload);
      state.total += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCallLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCallLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload.data.callLogs;
        state.total = action.payload.data.total;
        state.page = action.payload.data.page;
        state.pages = action.payload.data.pages;
      })
      .addCase(fetchCallLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteCallLog.fulfilled, (state, action) => {
        state.logs = state.logs.filter(log => log._id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { addCallLog } = callLogSlice.actions;
export default callLogSlice.reducer;
