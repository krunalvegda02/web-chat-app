import { createAsyncThunk } from "@reduxjs/toolkit";
import { _get, _post, _patch, _delete } from "./apiClient";

export const createAsyncThunkHandler = (typePrefix, apiMethod, urlResolver, isMultipart = false) =>
  createAsyncThunk(typePrefix, async (payload, { rejectWithValue, getState }) => {
    try {
      console.log(`🔹 [AsyncThunk] ${typePrefix} - Starting...`);
      const token = getState().auth.token;
      console.log(token)
      // console.log(`🔑 [AsyncThunk] ${typePrefix} - Token:`, token ? 'Present' : 'Missing');

      const url = typeof urlResolver === "function" ? urlResolver(payload) : urlResolver;
      console.log(`🎯 [AsyncThunk] ${typePrefix} - URL:`, url);
      
      // Determine request body based on payload structure
      let requestBody = {};
      
      if (typeof payload === 'object' && payload !== null) {
        // If payload has 'id' property, exclude it from body (it's used in URL)
        if ('id' in payload) {
          const { id, ...rest } = payload;
          requestBody = rest;
        } else {
          requestBody = payload;
        }
      }
      
      // Detect FormData automatically or use isMultipart flag
      const isFormData = requestBody instanceof FormData;
      const shouldUseMultipart = isMultipart === true || isFormData;
      
      // Log differently for FormData vs regular objects
      if (isFormData) {
        console.log(`📦 [AsyncThunk] ${typePrefix} - Request Body: FormData with`, requestBody.entries ? Array.from(requestBody.entries()).length : 'unknown', 'entries');
      } else {
        console.log(`📦 [AsyncThunk] ${typePrefix} - Request Body:`, JSON.stringify(requestBody, null, 2));
      }
      console.log(`📎 [AsyncThunk] ${typePrefix} - isMultipart:`, shouldUseMultipart);
      
      // For FormData/multipart: Don't set Content-Type manually - let axios set it with boundary
      // For regular requests: Set Authorization header
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      };
      
      // Don't set Content-Type for multipart - axios will set it automatically with boundary
      // The apiClient will handle removing any Content-Type header if FormData is detected
      
      const response = await apiMethod(url, requestBody, config);
      
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
      console.error(`❌ [AsyncThunk] ${typePrefix} - Error status:`, error.response?.status);
      console.error(`❌ [AsyncThunk] ${typePrefix} - Error stack:`, error.stack);
      
      // Extract the most specific error message
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response?.data) {
        const responseData = error.response.data;
        // Try different possible error message fields
        errorMessage = responseData.message || 
                      responseData.error || 
                      responseData.details || 
                      responseData.msg ||
                      (typeof responseData === 'string' ? responseData : errorMessage);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error(`❌ [AsyncThunk] ${typePrefix} - Final error message:`, errorMessage);
      return rejectWithValue(errorMessage);
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