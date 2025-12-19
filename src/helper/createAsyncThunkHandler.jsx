import { createAsyncThunk } from "@reduxjs/toolkit";
import { _get, _post, _patch, _delete } from "./apiClient";

export const createAsyncThunkHandler = (typePrefix, apiMethod, urlResolver, isMultipart = false) =>
  createAsyncThunk(typePrefix, async (payload, { rejectWithValue, getState }) => {
    try {
      console.log(`🔹 [AsyncThunk] ${typePrefix} - Starting...`);
      const token = getState().auth.token;
      console.log(token)
      console.log(`🔑 [AsyncThunk] ${typePrefix} - Token:`, token ? 'Present' : 'Missing');

      const url = typeof urlResolver === "function" ? urlResolver(payload) : urlResolver;
      console.log(`🎯 [AsyncThunk] ${typePrefix} - URL:`, url);
      
      // If payload is used in URL (string/number), don't send as body
      const shouldSendBody = typeof payload === 'object' && payload !== null;
      const requestBody = shouldSendBody ? payload : {};
      
      // Log differently for FormData vs regular objects
      if (requestBody instanceof FormData) {
        console.log(`📦 [AsyncThunk] ${typePrefix} - Request Body: FormData with`, requestBody.entries ? Array.from(requestBody.entries()).length : 'unknown', 'entries');
      } else {
        console.log(`📦 [AsyncThunk] ${typePrefix} - Request Body:`, JSON.stringify(requestBody, null, 2));
      }
      console.log(`📎 [AsyncThunk] ${typePrefix} - isMultipart:`, isMultipart);
      
      const response = await apiMethod(
        url,
        requestBody,
        isMultipart === true
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          : {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
      );
      
      console.log(`✅ [AsyncThunk] ${typePrefix} - Response:`, response.data);
      
      if (response.data.success) {
        return response.data;
      } else {
        console.error(`❌ [AsyncThunk] ${typePrefix} - API returned success=false:`, response.data.message);
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error(`❌ [AsyncThunk] ${typePrefix} - Error:`, error.message);
      console.error(`❌ [AsyncThunk] ${typePrefix} - Error response:`, error.response?.data);
      console.error(`❌ [AsyncThunk] ${typePrefix} - Error stack:`, error.stack);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  });

/*
  export const fetchItems = createAsyncThunkHandler(
    "items/fetchAll", // Type prefix
    _get,             // API method
    "/items"          // Static endpoint or resolver function
  );

  export const createItem = createAsyncThunkHandler(
    "items/create",
    _post,
    "/items"
  );
  
  export const updateItem = createAsyncThunkHandler(
    "items/update",
    _patch,
    (payload) => `/items/${payload.data.id}` // Dynamic endpoint based on payload
  );
  export const deleteItem = createAsyncThunkHandler(
    "items/delete",
    _delete,
    (payload) => `/items/${payload.data.id}`
  );

  builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.data.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload.data.id);
      });
    
  */