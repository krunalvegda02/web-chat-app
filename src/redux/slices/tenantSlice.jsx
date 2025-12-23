import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get, _post, _put, _delete, _patch } from '../../helper/apiClient';
import { buildUrlWithParams } from '../../helper/helperFunction';

export const getAllTenants = createAsyncThunkHandler(
  'tenant/getAllTenants',
  _get,
  (payload) => buildUrlWithParams('/tenants', payload)
);

export const createTenant = createAsyncThunkHandler(
  'tenant/createTenant',
  _post,
  '/tenants'
);

export const getTenantDetails = createAsyncThunkHandler(
  'tenant/getTenantDetails',
  _get,
  (payload) => `/tenants/${payload}`
);

export const getTenantBySlug = createAsyncThunkHandler(
  'tenant/getTenantBySlug',
  _get,
  (payload) => `/tenants/by-slug/${payload}`
);

export const updateTheme = createAsyncThunkHandler(
  'tenant/updateTheme',
  _put,
  (payload) => `/tenants/${payload.tenantId}/theme`
);

export const generateInviteLink = createAsyncThunkHandler(
  'tenant/generateInviteLink',
  _post,
  (payload) => `/tenants/${payload.tenantId}/invite-link`
);

export const getTenantUsers = createAsyncThunkHandler(
  'tenant/getTenantUsers',
  _get,
  (payload) => buildUrlWithParams(`/tenants/${payload.tenantId}/users`, { page: payload.page, limit: payload.limit })
);

export const getAdminUsers = createAsyncThunkHandler(
  'tenant/getAdminUsers',
  _get,
  (payload) => buildUrlWithParams('/tenants/admin-users', { page: payload?.page, limit: payload?.limit })
);

export const getTenantMembers = createAsyncThunkHandler(
  'tenant/getTenantMembers',
  _get,
  '/tenants/members'
);

export const updateTenant = createAsyncThunkHandler(
  'tenant/updateTenant',
  _put,
  (payload) => {
    const { id, ...data } = payload;
    return `/tenants/${id}`;
  }
);

export const toggleTenantStatus = createAsyncThunkHandler(
  'tenant/toggleTenantStatus',
  _patch,
  (payload) => `/tenants/${payload}/toggle-status`
);

export const deleteTenant = createAsyncThunkHandler(
  'tenant/deleteTenant',
  _delete,
  (payload) => `/tenants/${payload}`
);

const initialState = {
  tenants: [],
  currentTenant: {},
  tenantUsers: [],
  tenantMembers: [],
  inviteLink: '',
  loading: false,
  error: null,
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllTenants.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllTenants.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure tenants is always an array
        const data = action.payload.data;
        state.tenants = Array.isArray(data) ? data : data?.tenants || [];
      })
      .addCase(getAllTenants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTenant.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure tenants is an array before unshift
        if (!Array.isArray(state.tenants)) {
          state.tenants = [];
        }
        const newTenant = action.payload.data?.tenant || action.payload.data;
        state.tenants.unshift(newTenant);
      })
      .addCase(createTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getTenantDetails.fulfilled, (state, action) => {
        state.currentTenant = action.payload.data;
      })
      .addCase(getTenantBySlug.fulfilled, (state, action) => {
        state.currentTenant = action.payload.data;
      })
      .addCase(updateTheme.fulfilled, (state, action) => {
        if (state.currentTenant) {
          state.currentTenant.theme = action.payload.data;
        }
      })
      .addCase(generateInviteLink.fulfilled, (state, action) => {
        state.inviteLink = action.payload.data;
      })
      .addCase(getTenantUsers.fulfilled, (state, action) => {
        state.tenantUsers = action.payload.data;
      })
      .addCase(getAdminUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.tenantUsers = action.payload.data;
      })
      .addCase(getAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getTenantMembers.pending, (state) => {
        state.loading = true;
      })
      .addCase(getTenantMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.tenantMembers = action.payload.data.members;
      })
      .addCase(getTenantMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTenant.fulfilled, (state, action) => {
        state.loading = false;
        const updatedTenant = action.payload.data?.tenant || action.payload.data;
        const index = state.tenants.findIndex(t => t._id === updatedTenant._id);
        if (index !== -1) {
          state.tenants[index] = updatedTenant;
        }
      })
      .addCase(updateTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleTenantStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleTenantStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedTenant = action.payload.data?.tenant || action.payload.data;
        const index = state.tenants.findIndex(t => t._id === updatedTenant._id);
        if (index !== -1) {
          state.tenants[index] = updatedTenant;
        }
      })
      .addCase(toggleTenantStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTenant.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.meta.arg;
        state.tenants = state.tenants.filter(t => t._id !== deletedId);
      })
      .addCase(deleteTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = tenantSlice.actions;
export default tenantSlice.reducer;