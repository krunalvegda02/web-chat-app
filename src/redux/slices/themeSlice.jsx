import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get, _put, _post } from '../../helper/apiClient';
import API from '../../constants/ApiEndpoints';

export const fetchTenantTheme = createAsyncThunk(
  'theme/fetchTenantTheme',
  async (tenantId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token;
      
      const response = await _get(API.TENANT.GET_THEME.replace(':tenantId', tenantId), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
  {
    condition: (tenantId, { getState }) => {
      const state = getState();
      // Only prevent if already loading to avoid race conditions
      return !state.theme.loading;
    }
  }
);

export const updateTenantTheme = createAsyncThunkHandler(
  'theme/updateTenantTheme',
  _put,
  (payload) => API.TENANT.UPDATE_THEME.replace(':tenantId', payload.tenantId)
);

export const uploadThemeImage = createAsyncThunk(
  'theme/uploadThemeImage',
  async (payload, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const formData = new FormData();
      formData.append('image', payload.file);
      formData.append('type', payload.type);
      if (payload.oldUrl) {
        formData.append('oldUrl', payload.oldUrl);
      }

      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/v1/upload/theme-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  theme: {},
  tenantTheme: {},
  loading: false,
  updating: false,
  uploading: false,
  error: null,
  fetchedTenantIds: [],
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
      .addCase(fetchTenantTheme.pending, (state, action) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenantTheme.fulfilled, (state, action) => {
        state.loading = false;
        const themeData = action.payload?.data?.theme || action.payload?.theme || {};
        state.theme = themeData;
        state.tenantTheme = themeData;
        const tenantId = action.meta.arg;
        if (!state.fetchedTenantIds?.includes(tenantId)) {
          state.fetchedTenantIds = [...(state.fetchedTenantIds || []), tenantId];
        }
      })
      .addCase(fetchTenantTheme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTenantTheme.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateTenantTheme.fulfilled, (state, action) => {
        state.updating = false;
        const themeData = action.payload?.data?.theme || action.payload?.theme || {};
        state.theme = themeData;
        state.tenantTheme = themeData;
      })
      .addCase(updateTenantTheme.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      .addCase(uploadThemeImage.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadThemeImage.fulfilled, (state) => {
        state.uploading = false;
      })
      .addCase(uploadThemeImage.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = themeSlice.actions;
export default themeSlice.reducer;