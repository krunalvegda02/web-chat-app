import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { _get, _post, _delete } from '../../helper/apiClient';

export const fetchContacts = createAsyncThunk(
  'contacts/fetchContacts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await _get('/contacts');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch contacts');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'contacts/searchUsers',
  async (query, { rejectWithValue }) => {
    try {
      const response = await _get(`/contacts/search?query=${query}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search users');
    }
  }
);

export const addContact = createAsyncThunk(
  'contacts/addContact',
  async (contactData, { rejectWithValue }) => {
    try {
      const response = await _post('/contacts', contactData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add contact');
    }
  }
);

export const removeContact = createAsyncThunk(
  'contacts/removeContact',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await _delete(`/contacts/${userId}`);
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove contact');
    }
  }
);

const contactSlice = createSlice({
  name: 'contacts',
  initialState: {
    contacts: [],
    searchResults: [],
    loading: false,
    searchLoading: false,
    error: null,
  },
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = action.payload?.data?.contacts || action.payload?.contacts || [];
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload?.data?.users || action.payload?.users || [];
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
      })
      .addCase(addContact.fulfilled, (state, action) => {
        state.contacts.push(action.payload.contact);
      })
      .addCase(addContact.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(removeContact.fulfilled, (state, action) => {
        state.contacts = state.contacts.filter(c => c.userId._id !== action.payload.userId);
      })
      .addCase(removeContact.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearSearchResults, clearError } = contactSlice.actions;
export default contactSlice.reducer;
