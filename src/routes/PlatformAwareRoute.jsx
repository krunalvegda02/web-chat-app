import { useSelector } from 'react-redux';
import { usePlatformDetection } from '../hooks/usePlatformDetection';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * Platform-aware route wrapper
 * Prevents rendering content until platform authentication is complete
 */
export default function PlatformAwareRoute({ children }) {
  const { user, initialized } = useSelector(state => state.auth);
  const { isDetected, isProcessing, error } = usePlatformDetection();

  console.log('🔐 [PlatformAwareRoute] State:', {
    initialized,
    user: !!user,
    isDetected,
    isProcessing,
    error,
  });

  // Wait for initialization
  if (!initialized) {
    return <LoadingSpinner fullScreen />;
  }

  // If platform is detected and still processing, show loading
  if (isDetected && isProcessing && !user) {
    console.log('⏳ [PlatformAwareRoute] Platform processing, showing loading');
    return <LoadingSpinner fullScreen />;
  }

  // If platform is detected but no user and no error, still show loading
  if (isDetected && !user && !error) {
    console.log('⏳ [PlatformAwareRoute] Platform detected but no user, showing loading');
    return <LoadingSpinner fullScreen />;
  }

  // If user is authenticated or no platform detected, render children
  if (user || !isDetected) {
    console.log('✅ [PlatformAwareRoute] Rendering children');
    return children;
  }

  // Default: show loading
  return <LoadingSpinner fullScreen />;
}
