import { useTheme } from '../hooks/useTheme';

/**
 * ThemeProvider - Wraps components with theme context
 * Applies theme colors to the entire app
 * DEFAULT: WhatsApp Green Theme
 */
export default function ThemeProvider({ children }) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        '--primary-color': theme.primaryColor || '#008069',
        '--secondary-color': theme.secondaryColor || '#E5DDD5',
        '--accent-color': theme.accentColor || '#25D366',
        '--background-color': theme.backgroundColor || '#FFFFFF',
        '--border-color': theme.borderColor || '#E9EDEF',
        '--header-background': theme.headerBackgroundColor || '#008069',
        '--header-text': theme.headerTextColor || '#FFFFFF',
        '--sidebar-background': theme.sidebarBackgroundColor || '#FFFFFF',
        '--sidebar-header': theme.sidebarHeaderColor || '#008069',
        '--sidebar-text': theme.sidebarTextColor || '#111B21',
        '--sidebar-hover': theme.sidebarHoverColor || '#F5F6F6',
        '--sidebar-active': theme.sidebarActiveColor || '#F0F2F5',
        '--sidebar-border': theme.sidebarBorderColor || '#E9EDEF',
        '--chat-bubble-admin': theme.chatBubbleAdmin || '#DCF8C6',
        '--chat-bubble-user': theme.chatBubbleUser || '#FFFFFF',
        '--chat-bubble-admin-text': theme.chatBubbleAdminText || '#111B21',
        '--chat-bubble-user-text': theme.chatBubbleUserText || '#111B21',
        '--message-font-size': `${theme.messageFontSize || 14}px`,
        '--message-border-radius': `${theme.messageBorderRadius || 8}px`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Hook to get theme CSS variables
 */
export const useThemeVars = () => {
  const { theme } = useTheme();
  
  return {
    primaryColor: theme.primaryColor || '#008069',
    secondaryColor: theme.secondaryColor || '#E5DDD5',
    accentColor: theme.accentColor || '#25D366',
    backgroundColor: theme.backgroundColor || '#FFFFFF',
    borderColor: theme.borderColor || '#E9EDEF',
    headerBackgroundColor: theme.headerBackgroundColor || '#008069',
    headerTextColor: theme.headerTextColor || '#FFFFFF',
    sidebarBackgroundColor: theme.sidebarBackgroundColor || '#FFFFFF',
    sidebarHeaderColor: theme.sidebarHeaderColor || '#008069',
    sidebarTextColor: theme.sidebarTextColor || '#111B21',
    sidebarHoverColor: theme.sidebarHoverColor || '#F5F6F6',
    sidebarActiveColor: theme.sidebarActiveColor || '#F0F2F5',
    sidebarBorderColor: theme.sidebarBorderColor || '#E9EDEF',
    chatBubbleAdmin: theme.chatBubbleAdmin || '#DCF8C6',
    chatBubbleUser: theme.chatBubbleUser || '#FFFFFF',
    chatBubbleAdminText: theme.chatBubbleAdminText || '#111B21',
    chatBubbleUserText: theme.chatBubbleUserText || '#111B21',
    messageFontSize: theme.messageFontSize || 14,
    messageBorderRadius: theme.messageBorderRadius || 8,
    bubbleStyle: theme.bubbleStyle || 'rounded',
    showAvatars: theme.showAvatars !== false,
    showReadStatus: theme.showReadStatus !== false,
    enableTypingIndicator: theme.enableTypingIndicator !== false,
  };
};
