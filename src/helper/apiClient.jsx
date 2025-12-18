import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL + "/v1/";

const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

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