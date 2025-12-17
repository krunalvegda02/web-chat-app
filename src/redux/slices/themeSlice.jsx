import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get, _put } from '../../helper/apiClient';

export const fetchTenantTheme = createAsyncThunkHandler(
  'theme/fetchTenantTheme',
  _get,
  (payload) => `/tenants/by-slug/${payload}`
);

export const updateTenantTheme = createAsyncThunkHandler(
  'theme/updateTenantTheme',
  _put,
  (payload) => `/tenants/${payload.tenantId}/theme`
);

const initialState = {
  theme: {
    logoUrl: "",
    primaryColor: "",
    secondaryColor: "",
    backgroundImageUrl: "",
    chatBubbleAdmin: "",
    chatBubbleUser: "",
  },
  loading: false,
  error: null,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenantTheme.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenantTheme.fulfilled, (state, action) => {
        state.loading = false;
        state.theme = { ...state.theme, ...action.payload.data };
      })
      .addCase(fetchTenantTheme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTenantTheme.fulfilled, (state, action) => {
        state.theme = { ...state.theme, ...action.payload.data };
      });
  },
});

export const { clearError } = themeSlice.actions;
export default themeSlice.reducer;