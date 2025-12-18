import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

// Default theme
const DEFAULT_THEME = {
  appName: 'Chat App',
  logoUrl: null,
  logoHeight: 40,
  primaryColor: '#3B82F6',
  secondaryColor: '#E8F0FE',
  accentColor: '#06B6D4',
  backgroundColor: '#FFFFFF',
  borderColor: '#E2E8F0',
  headerBackground: '#F8FAFC',
  headerText: '#1F2937',
  chatBackgroundImage: null,
  chatBubbleAdmin: '#3B82F6',
  chatBubbleUser: '#F3F4F6',
  chatBubbleAdminText: '#FFFFFF',
  chatBubbleUserText: '#1F2937',
  messageFontSize: 14,
  messageBorderRadius: 12,
  bubbleStyle: 'rounded',
  blurEffect: 0.1,
  showAvatars: true,
  showReadStatus: true,
  enableTypingIndicator: true,
};

export const useTheme = () => {
  const { user } = useSelector((state) => state.auth || {});
  const { tenantTheme, loading } = useSelector((state) => state.theme || {});
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If user is not ADMIN/SUPER_ADMIN, use tenant theme, otherwise use default
    if (user?.role === 'USER' && tenantTheme) {
      setTheme({ ...DEFAULT_THEME, ...tenantTheme });
    } else {
      setTheme(DEFAULT_THEME);
    }
    setIsLoading(loading || false);
  }, [user, tenantTheme, loading]);

  return { theme, isLoading };
};

export default DEFAULT_THEME;