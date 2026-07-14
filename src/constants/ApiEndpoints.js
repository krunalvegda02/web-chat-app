const API = {
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        ME: '/auth/me',
    },
    CHAT: {
        AVAILABLE_USERS: '/chat/available-users',
        ROOMS: '/chat/rooms',
        DIRECT: '/chat/direct',
        CONTACT_CHAT: '/chat/contact-chat',
        GROUP: '/chat/group',
        ADMIN_CHAT: '/chat/admin-chat',
        CREATE_OR_GET_ROOM: '/chat/create-or-get-room',
        DELETE_ROOM: '/chat/rooms',
        ROOM_MESSAGES: '/chat/rooms',
        SEARCH_MESSAGES: '/chat/rooms',
        MARK_AS_READ: '/chat/rooms',
        MARK_DELIVERED: '/chat/mark-delivered',
        ALL_CHATS: '/chat/admin/all-chats',
        ADMIN_CHATS_BY_ID: '/chat/admin/chats',
        SEND_MESSAGE: '/chat/messages/send',
        FORWARD_MESSAGE: '/chat/forward-message',
        EDIT_MESSAGE: '/chat/edit-message',
        DELETE_MESSAGE: '/chat/delete-message',
        ADMIN_MEMBER_CHATS: '/chat/admin/member-chats',
        SPECIFIC_MEMBER_CHATS: '/chat/admin/member-chats/:memberId',
        MEMBER_CHAT_HISTORY: '/chat/admin/member-chats/:memberId/room/:roomId',
    },
    PLATFORM: {
        GET_THEME: '/platforms/:platformId/theme',
        UPDATE_THEME: '/platforms/:platformId/theme',
    },
    UPLOAD: {
        THEME_IMAGE: '/upload/theme-image',
        CHAT_MEDIA: '/upload/chat-media',
    },
};

export default API;
