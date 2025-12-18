import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get, _put, _post } from '../../helper/apiClient';
import API from '../../constants/ApiEndpoints';

export const fetchTenantTheme = createAsyncThunkHandler(
  'theme/fetchTenantTheme',
  _get,
  (payload) => API.TENANT.GET_THEME.replace(':tenantId', payload)
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
  theme: {
    appName: 'Chat App',
    logoUrl: null,
    logoHeight: 40,
    primaryColor: '#3B82F6',
    secondaryColor: '#E8F0FE',
    accentColor: '#06B6D4',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    headerBackground: '#F8FAFC',
    headerText: '#1F2937',
    chatBackgroundImage: null,
    chatBubbleAdmin: '#3B82F6',
    chatBubbleUser: '#F3F4F6',
    chatBubbleAdminText: '#FFFFFF',
    chatBubbleUserText: '#1F2937',
    messageFontSize: 14,
    messageBorderRadius: 12,
    bubbleStyle: 'rounded',
    blurEffect: 0.1,
    showAvatars: true,
    showReadStatus: true,
    enableTypingIndicator: true,
  },
  loading: false,
  updating: false,
  uploading: false,
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
        const themeData = action.payload?.data?.theme || action.payload?.theme || {};
        state.theme = { ...state.theme, ...themeData };
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
        state.theme = { ...state.theme, ...themeData };
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