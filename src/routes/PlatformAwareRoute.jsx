import { useSelector } from 'react-redux';
import { usePlatformDetection } from '../hooks/usePlatformDetection';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * Platform-aware route wrapper
 * Prevents rendering content until platform authentication is complete
 * Only applies to platform-specific routes
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

  // If no platform is detected, render children immediately (normal routing)
  if (!isDetected) {
    console.log('✅ [PlatformAwareRoute] No platform detected, rendering children');
    return children;
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

  // If user is authenticated, render children
  if (user) {
    console.log('✅ [PlatformAwareRoute] User authenticated, rendering children');
    return children;
  }

  // If there's an error, render children (let error handling happen elsewhere)
  if (error) {
    console.log('❌ [PlatformAwareRoute] Platform error, rendering children');
    return children;
  }

  // Default: show loading
  return <LoadingSpinner fullScreen />;
}
