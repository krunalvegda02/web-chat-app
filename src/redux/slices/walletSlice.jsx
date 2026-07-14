import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get, _post, _patch } from '../../helper/apiClient';
import { buildUrlWithParams } from '../../helper/helperFunction';

// ============================================
// WALLET ASYNC THUNKS
// ============================================

export const fetchWalletBalance = createAsyncThunkHandler(
  'wallet/fetchBalance',
  _get,
  '/wallet/balance'
);

export const fetchWalletHistory = createAsyncThunkHandler(
  'wallet/fetchHistory',
  _get,
  (payload) => buildUrlWithParams('/wallet/history', payload)
);

export const requestCredits = createAsyncThunkHandler(
  'wallet/requestCredits',
  _post,
  '/wallet/request'
);

export const fetchPendingRequests = createAsyncThunkHandler(
  'wallet/fetchPending',
  _get,
  (payload) => buildUrlWithParams('/wallet/pending', payload)
);

export const approveCreditRequest = createAsyncThunkHandler(
  'wallet/approve',
  _patch,
  (payload) => `/wallet/${payload.transactionId}/approve`
);

export const rejectCreditRequest = createAsyncThunkHandler(
  'wallet/reject',
  _patch,
  (payload) => `/wallet/${payload.transactionId}/reject`
);

export const addCreditsManually = createAsyncThunkHandler(
  'wallet/addManually',
  _post,
  '/wallet/add-credits'
);

export const fetchBankDetails = createAsyncThunkHandler(
  'wallet/fetchBankDetails',
  _get,
  '/platforms/bank-details'
);

export const updateBankDetails = createAsyncThunkHandler(
  'wallet/updateBankDetails',
  _patch,
  '/platforms/bank-details'
);

// ============================================
// WALLET SLICE
// ============================================

const initialState = {
  balance: 0,
  currency: 'ChatCoin',
  transactions: [],
  pendingRequests: [],
  bankDetails: null,
  loading: false,
  balanceLoading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  pendingPagination: { page: 1, limit: 20, total: 0, pages: 0 },
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearWalletError(state) {
      state.error = null;
    },
    decrementBalance(state, action) {
      state.balance = Math.max(0, state.balance - action.payload);
    },
    setBalance(state, action) {
      state.balance = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Balance
      .addCase(fetchWalletBalance.pending, (state) => {
        state.balanceLoading = true;
      })
      .addCase(fetchWalletBalance.fulfilled, (state, action) => {
        state.balanceLoading = false;
        const data = action.payload.data;
        state.balance = data?.balance ?? 0;
        state.currency = data?.currency || 'ChatCoin';
      })
      .addCase(fetchWalletBalance.rejected, (state, action) => {
        state.balanceLoading = false;
        state.error = action.payload;
      })

      // Fetch History
      .addCase(fetchWalletHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWalletHistory.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        state.transactions = data?.transactions || [];
        if (data?.pagination) state.pagination = data.pagination;
      })
      .addCase(fetchWalletHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Request Credits
      .addCase(requestCredits.pending, (state) => {
        state.loading = true;
      })
      .addCase(requestCredits.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(requestCredits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Pending
      .addCase(fetchPendingRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        state.pendingRequests = data?.transactions || [];
        if (data?.pagination) state.pendingPagination = data.pagination;
      })
      .addCase(fetchPendingRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Approve
      .addCase(approveCreditRequest.fulfilled, (state, action) => {
        const txId = action.meta.arg?.transactionId;
        state.pendingRequests = state.pendingRequests.filter(t => t._id !== txId);
      })

      // Reject
      .addCase(rejectCreditRequest.fulfilled, (state, action) => {
        const txId = action.meta.arg?.transactionId;
        state.pendingRequests = state.pendingRequests.filter(t => t._id !== txId);
      })

      // Add Credits Manually
      .addCase(addCreditsManually.fulfilled, (state) => {
        state.loading = false;
      })

      // Bank Details
      .addCase(fetchBankDetails.fulfilled, (state, action) => {
        state.bankDetails = action.payload.data?.bank || null;
      })
      .addCase(updateBankDetails.fulfilled, (state, action) => {
        state.bankDetails = action.payload.data?.bank || null;
      });
  },
});

export const { clearWalletError, decrementBalance, setBalance } = walletSlice.actions;
export default walletSlice.reducer;
