import axios from "axios";
import store from '../redux/store';
import { logout } from '../redux/slices/authSlice';

const BASE_URL = import.meta.env.VITE_API_BASE_URL + "/v1/";

const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to handle FormData uploads and add auth token
apiClient.interceptors.request.use(
    (config) => {
        // Add auth token from Redux store
        const state = store.getState();
        const token = state.auth?.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // If data is FormData, remove Content-Type header to let axios set it automatically with boundary
        if (config.data instanceof FormData) {
            // Delete Content-Type from headers to allow axios to set it with proper boundary
            if (config.headers) {
                delete config.headers['Content-Type'];
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/join')) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                store.dispatch(logout());
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// eslint-disable-next-line no-unused-vars
const _get = (url, data = {}, config = {}) => {
    return apiClient.get(url, config);
};

// eslint-disable-next-line no-unused-vars
const _delete = (url, data = {}, config = {}) => {
    return apiClient.delete(url, config);
};

const _patch = (url, data = {}, config = {}) => {
    return apiClient.patch(url, data, config);
};

const _post = (url, data = {}, config = {}) => {
    return apiClient.post(url, data, config);
};

const _put = (url, data = {}, config = {}) => {
    return apiClient.put(url, data, config);
};

export { _delete, _get, _post, _patch, _put };