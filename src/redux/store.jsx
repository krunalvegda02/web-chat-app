import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { combineReducers } from '@reduxjs/toolkit';

// ✅ BULLETPROOF CUSTOM STORAGE
const storage = {
  getItem: (key) => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && localStorage) {
        try {
          resolve(localStorage.getItem(key));
        } catch (error) {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  },
  setItem: (key, value) => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && localStorage) {
        try {
          localStorage.setItem(key, value);
          resolve();
        } catch (error) {
          resolve();
        }
      } else {
        resolve();
      }
    });
  },
  removeItem: (key) => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && localStorage) {
        try {
          localStorage.removeItem(key);
          resolve();
        } catch (error) {
          resolve();
        }
      } else {
        resolve();
      }
    });
  },
};

import authReducer from './slices/authSlice.jsx';
import chatReducer from './slices/chatSlice.jsx';
import tenantReducer from './slices/tenantSlice.jsx';
import userReducer from './slices/userSlice.jsx';
import themeReducer from './slices/themeSlice.jsx';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  tenant: tenantReducer,
  user: userReducer,
  theme: themeReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'chat/socketMessageReceived'],
        ignoredPaths: ['register', 'rehydrate', 'chat.onlineUsers', 'chat.typingUsers'],
      },
    }),
});

// Expose store globally for socket access
if (typeof window !== 'undefined') {
  window.__REDUX_STORE__ = store;
}

export const persistor = persistStore(store);
export default store;
