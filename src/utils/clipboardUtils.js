/**
 * Clipboard Utility Functions
 * Provides safe clipboard operations with fallbacks for different environments
 */

/**
 * Copy text to clipboard with fallback methods
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export const copyToClipboard = async (text) => {
  try {
    // Method 1: Modern Clipboard API (requires HTTPS)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Method 2: Fallback using document.execCommand (deprecated but widely supported)
    if (document.execCommand) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        throw err;
      }
    }
    
    // Method 3: Manual selection fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'absolute';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    
    // For mobile devices
    if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
      textArea.contentEditable = true;
      textArea.readOnly = true;
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.select();
    }
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      throw err;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Copy text to clipboard and show appropriate message
 * @param {string} text - Text to copy
 * @param {Function} messageApi - Ant Design message API
 * @param {string} successMessage - Success message to show
 * @param {string} errorMessage - Error message to show
 */
export const copyToClipboardWithMessage = async (
  text, 
  messageApi, 
  successMessage = 'Copied to clipboard',
  errorMessage = 'Failed to copy to clipboard'
) => {
  const success = await copyToClipboard(text);
  
  if (success) {
    messageApi.success(successMessage);
  } else {
    messageApi.error(errorMessage);
    // Show the text in a modal or alert as fallback
    if (window.prompt) {
      window.prompt('Copy this text manually:', text);
    } else {
      alert(`Please copy this text manually: ${text}`);
    }
  }
  
  return success;
};

/**
 * Check if clipboard API is available
 * @returns {boolean} - Whether clipboard API is available
 */
export const isClipboardAvailable = () => {
  return !!(navigator.clipboard && navigator.clipboard.writeText);
};

/**
 * Share text using Web Share API with clipboard fallback
 * @param {string} text - Text to share
 * @param {string} title - Share title (optional)
 * @param {string} url - Share URL (optional)
 * @param {Function} messageApi - Ant Design message API for fallback
 * @returns {Promise<boolean>} - Success status
 */
export const shareOrCopy = async (
  text, 
  title = '', 
  url = '', 
  messageApi = null,
  successMessage = 'Copied to clipboard'
) => {
  try {
    // Try Web Share API first (mobile devices)
    if (navigator.share) {
      const shareData = { text };
      if (title) shareData.title = title;
      if (url) shareData.url = url;
      
      await navigator.share(shareData);
      return true;
    }
    
    // Fallback to clipboard
    const success = await copyToClipboard(text);
    if (success && messageApi) {
      messageApi.success(successMessage);
    }
    return success;
  } catch (error) {
    console.error('Failed to share or copy:', error);
    // Final fallback to clipboard
    const success = await copyToClipboard(text);
    if (success && messageApi) {
      messageApi.success(successMessage);
    }
    return success;
  }
};

export default {
  copyToClipboard,
  copyToClipboardWithMessage,
  isClipboardAvailable,
  shareOrCopy
};