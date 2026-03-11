import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { _get, _post, _delete, _put } from '../../helper/apiClient';
import API from '../../constants/ApiEndpoints';

export const searchUserByPhoneOrEmail = createAsyncThunk(
  'contacts/searchUserByPhoneOrEmail',
  async (query, { rejectWithValue }) => {
    try {
      const response = await _get(`${API.CONTACTS.SEARCH_USER}?query=${query}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search user');
    }
  }
);

export const addContact = createAsyncThunk(
  'contacts/addContact',
  async (contactData, { rejectWithValue }) => {
    try {
      const response = await _post(API.CONTACTS.ADD, contactData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add contact');
    }
  }
);

export const fetchContacts = createAsyncThunk(
  'contacts/fetchContacts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await _get(API.CONTACTS.GET_ALL);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch contacts');
    }
  }
);

export const removeContact = createAsyncThunk(
  'contacts/removeContact',
  async (contactId, { rejectWithValue }) => {
    try {
      const response = await _delete(`${API.CONTACTS.REMOVE}/${contactId}`);
      return { contactId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove contact');
    }
  }
);

export const updateContactName = createAsyncThunk(
  'contacts/updateContactName',
  async ({ contactId, contactName }, { rejectWithValue }) => {
    try {
      const response = await _put(`${API.CONTACTS.UPDATE_NAME}/${contactId}`, { contactName });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update contact name');
    }
  }
);

const contactSlice = createSlice({
  name: 'contacts',
  initialState: {
    contacts: [],
    searchResults: [],
    searchedUser: null,
    loading: false,
    searchLoading: false,
    error: null,
  },
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchedUser = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchUserByPhoneOrEmail.pending, (state) => {
        state.searchLoading = true;
        state.error = null;
        state.searchedUser = null;
      })
      .addCase(searchUserByPhoneOrEmail.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchedUser = action.payload?.data;
      })
      .addCase(searchUserByPhoneOrEmail.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
      })
      .addCase(addContact.fulfilled, (state) => {
        state.searchedUser = null;
      })
      .addCase(addContact.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = action.payload?.data?.contacts || [];
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeContact.fulfilled, (state, action) => {
        state.contacts = state.contacts.filter(c => c._id !== action.payload.contactId);
      })
      .addCase(removeContact.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateContactName.fulfilled, (state, action) => {
        const updatedContact = action.payload?.data?.contact;
        if (updatedContact) {
          const index = state.contacts.findIndex(c => c._id === updatedContact._id);
          if (index !== -1) {
            state.contacts[index] = updatedContact;
          }
        }
      })
      .addCase(updateContactName.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearSearchResults, clearError } = contactSlice.actions;
export default contactSlice.reducer;
