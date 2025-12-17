
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [] 
}) {
  const { user, initialized } = useSelector((s) => s.auth);

  if (!initialized) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
