import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { notificationService } from '../services/notificationService';

export const useNotifications = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [permission, setPermission] = useState('default');
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) return;

    const currentPermission = Notification.permission;
    setPermission(currentPermission);
    setIsEnabled(currentPermission === 'granted');

    if (currentPermission === 'granted') {
      notificationService.getFCMToken();
      notificationService.setupForegroundListener();
    }
  }, [user]);

  const requestPermission = useCallback(async () => {
    const granted = await notificationService.requestPermission();
    setIsEnabled(granted);
    setPermission(granted ? 'granted' : 'denied');
    return granted;
  }, []);

  return {
    isEnabled,
    permission,
    requestPermission,
  };
};

export default useNotifications;
