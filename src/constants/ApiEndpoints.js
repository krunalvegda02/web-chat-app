const API = {
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        ME: '/auth/me',
    },
    CHAT: {
        AVAILABLE_USERS: '/chat/available-users',
        ROOMS: '/chat/rooms',
        DIRECT: '/chat/direct',
        GROUP: '/chat/group',
        ADMIN_CHAT: '/chat/admin-chat',
        ROOM_MESSAGES: '/chat/rooms',
        SEARCH_MESSAGES: '/chat/rooms',
        MARK_AS_READ: '/chat/rooms',
        ALL_CHATS: '/chat/admin/all-chats',
        ADMIN_CHATS_BY_ID: '/chat/admin/chats',
    },
    TENANT: {
        GET_ALL: '/tenants',
        GET_THEME: '/tenants/:tenantId/theme',
        UPDATE_THEME: '/tenants/:tenantId/theme',
        ADMIN_USERS: '/tenants/admin-users',
    },
    UPLOAD: {
        THEME_IMAGE: '/upload/theme-image',
    },
};

export default API;
