import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useTheme } from '../../hooks/useTheme';

/**
 * Unified Loading Component
 * Provides consistent loading experience across all pages
 * Hides architecture complexity from users
 */
export default function UnifiedLoader({ 
  tip = 'Loading...', 
  size = 'large',
  fullScreen = true,
  showTip = true,
  retryCount = 0
}) {
  const { theme } = useTheme();

  // Dynamic loading messages based on retry count
  const getLoadingMessage = () => {
    if (retryCount === 0) return tip;
    if (retryCount === 1) return 'Establishing connection...';
    if (retryCount === 2) return 'Almost there...';
    return 'Finalizing setup...';
  };

  const customIcon = (
    <LoadingOutlined 
      style={{ 
        fontSize: size === 'large' ? 48 : size === 'small' ? 24 : 36,
        color: theme?.primaryColor || '#008069'
      }} 
      spin 
    />
  );

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Spin 
        indicator={customIcon} 
        size={size}
      />
      {showTip && (
        <div 
          className="text-center"
          style={{ 
            color: theme?.textColor || '#667781',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          {getLoadingMessage()}
        </div>
      )}
      {retryCount > 0 && (
        <div 
          className="text-center text-sm"
          style={{ 
            color: theme?.secondaryTextColor || '#8696A0',
            fontSize: '14px'
          }}
        >
          Please wait while we connect you...
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ 
          backgroundColor: theme?.backgroundColor || '#F0F2F5',
          backdropFilter: 'blur(2px)'
        }}
      >
        <div 
          className="bg-white rounded-lg p-8 shadow-lg border"
          style={{
            backgroundColor: theme?.cardBackgroundColor || '#FFFFFF',
            borderColor: theme?.borderColor || '#E9EDEF',
            minWidth: '200px'
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      {content}
    </div>
  );
}