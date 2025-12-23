import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTenantTheme } from '../redux/slices/themeSlice';

// Default theme - WhatsApp Style
const DEFAULT_THEME = {
  appName: 'Chat App',
  logoUrl: null,
  logoHeight: 40,
  sidebarBackgroundColor: '#FFFFFF',
  sidebarHeaderColor: '#008069',
  sidebarTextColor: '#111B21',
  sidebarHoverColor: '#F5F6F6',
  sidebarActiveColor: '#F0F2F5',
  sidebarBorderColor: '#E9EDEF',
  bottomNavBackgroundColor: '#FFFFFF',
  bottomNavActiveColor: '#008069',
  bottomNavInactiveColor: '#667781',
  bottomNavBorderColor: '#E9EDEF',
  headerBackgroundColor: '#008069',
  headerTextColor: '#FFFFFF',
  headerIconColor: '#FFFFFF',
  chatBackgroundColor: '#E5DDD5',
  chatBackgroundImage: null,
  senderBubbleColor: '#DCF8C6',
  senderTextColor: '#111B21',
  senderBubbleRadius: 8,
  receiverBubbleColor: '#FFFFFF',
  receiverTextColor: '#111B21',
  receiverBubbleRadius: 8,
  inputBackgroundColor: '#F0F2F5',
  inputTextColor: '#111B21',
  inputBorderColor: '#E9EDEF',
  inputPlaceholderColor: '#667781',
  sendButtonColor: '#008069',
  sendButtonIconColor: '#FFFFFF',
  unreadBadgeColor: '#25D366',
  avatarBackgroundColor: '#00A884',
  avatarTextColor: '#FFFFFF',
  timestampColor: '#667781',
  modalBackgroundColor: '#FFFFFF',
  modalTextColor: '#111B21',
  errorColor: '#ff4d4f',
  // Legacy fields for backward compatibility
  primaryColor: '#008069',
  secondaryColor: '#F0F2F5',
  accentColor: '#25D366',
  backgroundColor: '#FFFFFF',
  borderColor: '#E9EDEF',
  headerBackground: '#008069',
  headerText: '#FFFFFF',
  chatBubbleAdmin: '#DCF8C6',
  chatBubbleUser: '#FFFFFF',
  chatBubbleAdminText: '#111B21',
  chatBubbleUserText: '#111B21',
  messageFontSize: 14,
  messageBorderRadius: 8,
  bubbleStyle: 'rounded',
  blurEffect: 0.1,
  showAvatars: true,
  showReadStatus: true,
  enableTypingIndicator: true,
};

export const useTheme = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  const { theme: tenantTheme, loading, fetchedTenantIds } = useSelector((state) => state.theme || {});
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tenant theme when user logs in (only once per tenantId)
  useEffect(() => {
    const alreadyFetched = Array.isArray(fetchedTenantIds) && fetchedTenantIds.includes(user?.tenantId);
    if (user?.tenantId && user?.role === 'USER' && !alreadyFetched && !loading) {
      dispatch(fetchTenantTheme(user.tenantId));
    }
  }, [user?.tenantId, user?.role, dispatch, fetchedTenantIds, loading]);

  useEffect(() => {
    // USER role sees tenant's custom theme (if set by admin)
    // ADMIN, TENANT_ADMIN, and SUPER_ADMIN always see default WhatsApp theme
    const isAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(user?.role);
    
    if (user?.role === 'USER' && tenantTheme && Object.keys(tenantTheme).length > 0) {
      // Merge custom theme with WhatsApp defaults (only non-null values)
      const mergedTheme = { ...DEFAULT_THEME };
      
      // Only apply non-null custom theme values
      Object.keys(tenantTheme).forEach(key => {
        if (tenantTheme[key] !== null && tenantTheme[key] !== undefined) {
          mergedTheme[key] = tenantTheme[key];
        }
      });
      
      console.log('✅ Applied custom theme for USER:', mergedTheme);
      setTheme(mergedTheme);
    } else {
      // ADMIN/TENANT_ADMIN/SUPER_ADMIN or no custom theme: use default WhatsApp theme
      console.log('✅ Applied default WhatsApp theme for:', user?.role || 'guest');
      setTheme(DEFAULT_THEME);
    }
    setIsLoading(loading || false);
  }, [user?.role, tenantTheme, loading]);

  return { theme, isLoading };
};

export default DEFAULT_THEME;