import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Result, Button, Card, Alert } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { usePlatformDetection } from '../../hooks/usePlatformDetection';
import { useTheme } from '../../hooks/useTheme';
import UnifiedLoader from '../common/UnifiedLoader';

/**
 * Platform Gateway Component
 * Provides seamless authentication and navigation for external platform users
 * Only activates when platform parameters are detected in URL
 */
export default function PlatformGateway({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { user, initialized } = useSelector(state => state.auth);
  
  const {
    isDetected,
    isProcessing,
    error,
    userData,
    isValidApiKey,
    triggerPlatformLogin,
    retryCount,
  } = usePlatformDetection();
  
  const [showManualLogin, setShowManualLogin] = useState(false);
  
  // Update manual login state when error occurs
  useEffect(() => {
    if (error) {
      setShowManualLogin(true);
    }
  }, [error]);
  
  // Wait for initialization - show unified loading
  if (!initialized) {
    return <UnifiedLoader tip="Initializing..." />;
  }
  
  console.log('🔍 [PlatformGateway] State:', {
    isDetected,
    user: !!user,
    isProcessing,
    error,
    showManualLogin,
  });
  
  // If no platform detected, render children immediately
  if (!isDetected) {
    console.log('🔍 [PlatformGateway] No platform detected, rendering children');
    return children;
  }
  
  // If user is already authenticated, render children immediately
  if (user) {
    console.log('🔍 [PlatformGateway] User authenticated, rendering children');
    return children;
  }
  
  // If there's an error or manual login is needed - show unified loading instead of error screen
  if (error || showManualLogin) {
    // For platform users, show loading and auto-retry instead of error screen
    if (isDetected && userData) {
      console.log('🔄 [PlatformGateway] Auto-retrying platform login...');
      setTimeout(() => {
        setShowManualLogin(false);
        triggerPlatformLogin();
      }, 1500); // Retry after 1.5 seconds
      
      return <UnifiedLoader tip="Connecting to platform..." retryCount={retryCount || 0} />;
    }
    
    // Only show error screen for non-platform users or when no user data
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme?.sidebarBackgroundColor || '#F0F2F5' }}
      >
        <Card 
          className="w-full max-w-md shadow-lg" 
          style={{ 
            borderRadius: '12px', 
            border: `1px solid ${theme?.borderColor || '#E9EDEF'}` 
          }}
        >
          <Result
            status={error ? "error" : "warning"}
            title={error ? "Connection Failed" : "Manual Login Required"}
            subTitle={
              error || 
              "We detected you're from an external platform but couldn't auto-login. Please click below to continue."
            }
            extra={[
              <Button 
                key="retry"
                type="primary" 
                onClick={() => {
                  if (userData) {
                    setShowManualLogin(false);
                    triggerPlatformLogin();
                  } else {
                    navigate('/platform-auth' + location.search);
                  }
                }}
                loading={isProcessing}
                style={{ 
                  backgroundColor: theme?.primaryColor, 
                  borderColor: theme?.primaryColor 
                }}
                icon={<ArrowRightOutlined />}
              >
                {userData ? 'Try Again' : 'Continue to Login'}
              </Button>,
              <Button 
                key="manual"
                onClick={() => navigate('/login')}
              >
                Manual Login
              </Button>
            ]}
          />
          
          {isValidApiKey && (
            <Alert
              message="Platform Integration Active"
              description="This connection uses secure platform integration"
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Card>
      </div>
    );
  }
  
  // Platform detected and processing - show unified loading with retry info
  if (isProcessing) {
    console.log('🔍 [PlatformGateway] Platform processing, showing unified loading');
    return <UnifiedLoader tip="Connecting to platform..." retryCount={retryCount || 0} />;
  }
  
  // Platform detected but not processing - render children
  console.log('🔍 [PlatformGateway] Platform ready, rendering children');
  return children;
}
