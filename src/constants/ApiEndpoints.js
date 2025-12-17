const API = {
    AUTH: {
        REGISTER: '/api/v1/auth/register',
        LOGIN: '/api/v1/auth/login',
        LOGOUT: '/api/v1/auth/logout',
        ME: '/api/v1/auth/me',
    },
    CHAT: {
        ROOMS: '/chat/rooms',
        ADMIN_CHAT_ROOMS: '/chat/admin-chat-rooms',
        ROOM_MESSAGES: '/chat/rooms',
        CREATE_OR_GET_ADMIN_ROOM: '/chat/admin-rooms',
    },
    TENANT: {
        GET_ALL: '/api/v1/tenants',
    },
};

export default API;
