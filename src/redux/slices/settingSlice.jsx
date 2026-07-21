import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get, _put } from '../../helper/apiClient';

export const getGlobalPricing = createAsyncThunkHandler(
  'setting/getGlobalPricing',
  _get,
  '/settings/pricing'
);

export const updateGlobalPricing = createAsyncThunkHandler(
  'setting/updateGlobalPricing',
  _put,
  '/settings/pricing'
);

const initialState = {
  pricing: null,
  loading: false,
  error: null,
  updateLoading: false,
};

const settingSlice = createSlice({
  name: 'setting',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Get Pricing
    builder
      .addCase(getGlobalPricing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGlobalPricing.fulfilled, (state, action) => {
        state.loading = false;
        state.pricing = action.payload?.data || action.payload;
      })
      .addCase(getGlobalPricing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Pricing
    builder
      .addCase(updateGlobalPricing.pending, (state) => {
        state.updateLoading = true;
      })
      .addCase(updateGlobalPricing.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.pricing = action.payload?.data || action.payload;
      })
      .addCase(updateGlobalPricing.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      });
  },
});

export default settingSlice.reducer;
