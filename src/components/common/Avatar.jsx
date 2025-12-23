
import { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useSelector } from 'react-redux';
import { Spin } from 'antd';

export default function Avatar({
  name = 'U',
  size = 32,
  src = '',
  className = '',
  showLoading = false,
}) {
  const { theme } = useTheme();
  const { loading } = useSelector((state) => state.user);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (src) {
      setImageError(false);
      setImageLoaded(false);
    }
  }, [src]);

  // Get initials from name
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const initials = getInitials(name);
  const avatarBg = theme.avatarBackgroundColor || '#25D366';
  const avatarText = theme.avatarTextColor || '#FFFFFF';

  if (src && !imageError) {
    return (
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <img
          src={src}
          alt={name}
          className={`rounded-full object-cover w-full h-full ${className} ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } transition-opacity`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
        {!imageLoaded && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full font-semibold"
            style={{
              fontSize: size * 0.4,
              backgroundColor: avatarBg,
              color: avatarText,
            }}
          >
            {initials}
          </div>
        )}
        {showLoading && loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50">
            <Spin size="small" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className={`flex items-center justify-center rounded-full font-semibold ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          backgroundColor: avatarBg,
          color: avatarText,
        }}
      >
        {initials}
      </div>
      {showLoading && loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50">
          <Spin size="small" />
        </div>
      )}
    </div>
  );
}