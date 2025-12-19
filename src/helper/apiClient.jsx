import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL + "/v1/";

const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to handle FormData uploads
apiClient.interceptors.request.use(
    (config) => {
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