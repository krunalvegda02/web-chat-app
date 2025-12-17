
import { useState } from 'react';

export default function Avatar({ 
  name = 'U', 
  size = 32, 
  src = '', 
  className = '',
  bg = 'bg-blue-600' 
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Clean and get initials from name
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
      'bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-pink-600',
      'bg-indigo-600', 'bg-red-600', 'bg-yellow-600', 'bg-teal-600'
    ];
    const index = (name || 'U').charCodeAt(0) % colors.length;
    return colors[index];
  };

  const initials = getInitials(name);
  const avatarBg = bg === 'bg-blue-600' ? getAvatarColor(name) : bg;

  if (src && !imageError) {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <img
          src={src}
          alt={name}
          className={`rounded-full object-cover ${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ width: size, height: size }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
        {!imageLoaded && (
          <div
            className={`absolute inset-0 flex items-center justify-center rounded-full font-semibold text-white ${avatarBg}`}
            style={{ fontSize: size * 0.4 }}
          >
            {initials}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white ${avatarBg} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}
