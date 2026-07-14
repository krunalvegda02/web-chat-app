export function buildUrlWithParams(baseUrl, params = {}) {
    const { page, limit, search, type, excludeType, status } = params;

    const queryParams = new URLSearchParams();

    if (page) queryParams.append("page", page);
    if (limit) queryParams.append("limit", limit);
    if (search) queryParams.append("search", search);
    if (type) queryParams.append("type", type);
    if (excludeType) queryParams.append("excludeType", excludeType);
    if (status) queryParams.append("status", status);

    const queryString = queryParams.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export function buildUploadUrlPath(baseUrl, params = {}) {
    const { folder } = params;

    if (!folder) return baseUrl;

    const sanitizedFolder = folder.split("/").filter(Boolean).join("/");

    return `${baseUrl}/${sanitizedFolder}`;
}

export function removeNullValues(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== null));
}