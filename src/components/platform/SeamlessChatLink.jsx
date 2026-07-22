import React from 'react';

/**
 * Seamless Chat Link Component
 * Generates secure chat links for external platforms
 * Provides seamless user experience without login page
 */

/**
 * Generate a seamless chat link for external platforms
 * @param {Object} config - Configuration object
 * @param {string} config.apiKey - Platform API key
 * @param {string} config.name - User's name (username) — the only required identifier
 * @param {string} config.externalUserId - External user ID (optional)
 * @param {string} config.roomId - Specific room ID (optional)
 * @param {string} config.baseUrl - Base URL of the chat application
 * @param {boolean} config.autoLogin - Enable auto-login (default: true)
 * @param {string} config.redirect - Custom redirect path (optional)
 * @returns {string} Complete chat URL
 */
export const generateSeamlessChatLink = ({
  apiKey,
  name,
  externalUserId,
  roomId,
  baseUrl = window.location.origin,
  autoLogin = true,
  redirect
}) => {
  // Validate required parameters
  if (!apiKey || !name) {
    throw new Error('API key and name (username) are required');
  }

  // Create URL parameters
  const params = new URLSearchParams({
    apiKey,
    name: encodeURIComponent(name),
    autoLogin: autoLogin.toString(),
    platform: 'true'
  });

  // Add optional parameters
  if (externalUserId) {
    params.append('userId', encodeURIComponent(externalUserId));
  }
  
  if (roomId) {
    params.append('roomId', roomId);
  }
  
  if (redirect) {
    params.append('redirect', encodeURIComponent(redirect));
  }

  // Determine the target path
  let targetPath = '/user/chats';
  if (roomId) {
    targetPath = `/user/chats/${roomId}`;
  } else if (redirect) {
    targetPath = redirect;
  }

  return `${baseUrl}${targetPath}?${params.toString()}`;
};

/**
 * React component for seamless chat integration
 */
export const SeamlessChatButton = ({
  apiKey,
  name,
  externalUserId,
  roomId,
  baseUrl,
  autoLogin = true,
  redirect,
  children,
  className = '',
  style = {},
  target = '_blank',
  onClick,
  ...props
}) => {
  const handleClick = (e) => {
    try {
      const chatUrl = generateSeamlessChatLink({
        apiKey,
        name,
        externalUserId,
        roomId,
        baseUrl,
        autoLogin,
        redirect
      });

      // Call custom onClick handler if provided
      if (onClick) {
        onClick(e, chatUrl);
      }

      // If not prevented, open the chat
      if (!e.defaultPrevented) {
        if (target === '_blank') {
          window.open(chatUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = chatUrl;
        }
      }
    } catch (error) {
      console.error('Error generating chat link:', error);
      if (onClick) {
        onClick(e, null, error);
      }
    }
  };

  const defaultStyle = {
    backgroundColor: '#25D366',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    ...style
  };

  const defaultClassName = `seamless-chat-button ${className}`;

  // Render as button if no href behavior needed
  if (target !== '_blank' && !onClick) {
    return (
      <button
        className={defaultClassName}
        style={defaultStyle}
        onClick={handleClick}
        {...props}
      >
        {children || (
          <>
            💬 Start Chat
          </>
        )}
      </button>
    );
  }

  // Render as link for _blank target
  return (
    <a
      href="#"
      className={defaultClassName}
      style={defaultStyle}
      onClick={handleClick}
      {...props}
    >
      {children || (
        <>
          💬 Start Chat
        </>
      )}
    </a>
  );
};

/**
 * WhatsApp-style chat button
 */
export const WhatsAppChatButton = (props) => {
  return (
    <SeamlessChatButton
      {...props}
      style={{
        backgroundColor: '#25D366',
        color: 'white',
        border: 'none',
        borderRadius: '50px',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
        transition: 'all 0.3s ease',
        ...props.style
      }}
    >
      {props.children || (
        <>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.413 3.297"/>
          </svg>
          Chat with us
        </>
      )}
    </SeamlessChatButton>
  );
};

/**
 * Floating chat widget
 */
export const FloatingChatWidget = ({
  position = 'bottom-right',
  offset = 20,
  ...props
}) => {
  const positionStyles = {
    'bottom-right': { bottom: offset, right: offset },
    'bottom-left': { bottom: offset, left: offset },
    'top-right': { top: offset, right: offset },
    'top-left': { top: offset, left: offset }
  };

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 1000,
        ...positionStyles[position]
      }}
    >
      <WhatsAppChatButton
        {...props}
        style={{
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          padding: '0',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
          animation: 'pulse 2s infinite',
          ...props.style
        }}
      >
        {props.children || (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.413 3.297"/>
          </svg>
        )}
      </WhatsAppChatButton>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4);
          }
          50% {
            box-shadow: 0 4px 30px rgba(37, 211, 102, 0.8);
          }
        }
      `}</style>
    </div>
  );
};

/**
 * JavaScript integration code generator
 */
export const generateIntegrationCode = ({
  apiKey,
  baseUrl = 'https://your-chat-domain.com',
  buttonText = 'Chat with us',
  position = 'bottom-right'
}) => {
  return `
<!-- Seamless Chat Integration -->
<script>
(function() {
  // Configuration
  const CHAT_CONFIG = {
    apiKey: '${apiKey}',
    baseUrl: '${baseUrl}',
    buttonText: '${buttonText}',
    position: '${position}'
  };

  // Generate chat link
  function generateChatLink(userData) {
    const params = new URLSearchParams({
      apiKey: CHAT_CONFIG.apiKey,
      name: encodeURIComponent(userData.name),
      autoLogin: 'true',
      platform: 'true'
    });

    if (userData.userId) {
      params.append('userId', encodeURIComponent(userData.userId));
    }

    return CHAT_CONFIG.baseUrl + '/user/chats?' + params.toString();
  }

  // Create chat button
  function createChatButton() {
    const button = document.createElement('div');
    button.innerHTML = \`
      <div id="seamless-chat-widget" style="
        position: fixed;
        \${CHAT_CONFIG.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        \${CHAT_CONFIG.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        z-index: 1000;
        cursor: pointer;
      ">
        <div style="
          background: #25D366;
          color: white;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4);
          transition: all 0.3s ease;
          animation: pulse 2s infinite;
        ">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.413 3.297"/>
          </svg>
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4); }
          50% { box-shadow: 0 4px 30px rgba(37, 211, 102, 0.8); }
        }
      </style>
    \`;

    document.body.appendChild(button);

    // Add click handler
    document.getElementById('seamless-chat-widget').addEventListener('click', function() {
      // Get user data (customize this based on your platform)
      const userData = {
        name: 'User Name', // Replace with actual user name from your platform
        userId: 'user123' // Optional: your internal user ID for deduplication
      };

      const chatUrl = generateChatLink(userData);
      window.open(chatUrl, '_blank', 'noopener,noreferrer');
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createChatButton);
  } else {
    createChatButton();
  }

  // Expose global function for manual triggering
  window.openSeamlessChat = function(userData) {
    const chatUrl = generateChatLink(userData);
    window.open(chatUrl, '_blank', 'noopener,noreferrer');
  };
})();
</script>
`;
};

export default {
  generateSeamlessChatLink,
  SeamlessChatButton,
  WhatsAppChatButton,
  FloatingChatWidget,
  generateIntegrationCode
};