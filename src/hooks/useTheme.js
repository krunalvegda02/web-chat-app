import { useSelector } from 'react-redux';
import { useMemo } from 'react';

export function useTheme() {
  const { theme } = useSelector((s) => s.theme);

  const themeConfig = useMemo(
    () => ({
      primaryColor: theme.primaryColor || '#',
      secondaryColor: theme.secondaryColor || '#',
      accentColor: theme.accentColor || '#',
      chatBubbleAdmin: theme.chatBubbleAdmin || '#',
      chatBubbleUser: theme.chatBubbleUser || '#',
      backgroundImage: theme.backgroundImageUrl,
      logoUrl: theme.logoUrl,
    }),
    [theme]
  );

  return themeConfig;
}
