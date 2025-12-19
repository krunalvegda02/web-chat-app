
import { useState } from 'react';

export default function Avatar({
  name = 'U',
  size = 32,
  src = '',
  className = '',
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get initials from name
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Generate consistent color based on name
  const getAvatarColor = (name) => {
    const colors = [
      '#10B981', // Green - WhatsApp primary
      '#3B82F6', // Blue
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#06B6D4', // Cyan
      '#6366F1', // Indigo
    ];
    const index = (name || 'U').charCodeAt(0) % colors.length;
    return colors[index];
  };

  const initials = getInitials(name);
  const avatarBg = getAvatarColor(name);

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
            className="absolute inset-0 flex items-center justify-center rounded-full font-semibold text-white"
            style={{
              fontSize: size * 0.4,
              backgroundColor: avatarBg,
            }}
          >
            {initials}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: avatarBg,
      }}
    >
      {initials}
    </div>
  );
}