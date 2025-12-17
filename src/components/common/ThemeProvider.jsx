import { ConfigProvider, theme as antdTheme } from 'antd';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeProvider({ children }) {
  const theme = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: theme.primaryColor,
          colorSuccess: theme.accentColor,
          colorError: '#ef4444',
          colorWarning: '#f59e0b',
          colorInfo: '#3b82f6',
          borderRadius: 8,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        components: {
          Button: {
            controlHeight: 36,
            borderRadius: 8,
          },
          Input: {
            controlHeight: 36,
            borderRadius: 8,
          },
          Card: {
            borderRadius: 12,
          },
        },
      }}
    >
      <div
        className="min-h-screen bg-slate-950"
        style={{
          backgroundImage: theme.backgroundImage
            ? `url(${theme.backgroundImage})`
            : 'none',
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed',
        }}
      >
        {children}
      </div>
    </ConfigProvider>
  );
}
