import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get, _delete } from '../../helper/apiClient';
import { buildUrlWithParams } from '../../helper/helperFunction';
// import { API } from '../../constants/endpoints';

export const fetchCallLogs = createAsyncThunkHandler(
  'callLogs/fetchCallLogs',
  _get,
  (payload) => buildUrlWithParams('/call-logs/my-logs', payload || {})
);

export const deleteCallLog = createAsyncThunkHandler(
  'callLogs/deleteCallLog',
  _delete,
  (callLogId) => `/call-logs/${callLogId}`
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
    clearCallLogs: (state) => {
      state.logs = [];
      state.total = 0;
      state.page = 1;
      state.pages = 1;
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

export const { addCallLog, clearCallLogs } = callLogSlice.actions;
export default callLogSlice.reducer;
