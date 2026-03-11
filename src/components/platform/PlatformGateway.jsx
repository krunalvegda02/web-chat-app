import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spin, Result, Button, Card, Typography, Alert } from 'antd';
import { 
  LoadingOutlined, 
  ArrowRightOutlined
} from '@ant-design/icons';
import { usePlatformDetection } from '../../hooks/usePlatformDetection';
import { useTheme } from '../../hooks/useTheme';

const { Text } = Typography;

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
  } = usePlatformDetection();
  
  const [showManualLogin, setShowManualLogin] = useState(false);
  
  // Update manual login state when error occurs
  useEffect(() => {
    if (error) {
      setShowManualLogin(true);
    }
  }, [error]);
  
  // Wait for initialization
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
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
  
  // If there's an error or manual login is needed
  if (error || showManualLogin) {
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
  
  // Platform detected and processing - render children and let them handle loading
  console.log('🔍 [PlatformGateway] Platform processing, rendering children');
  return children;
}
