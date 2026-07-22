# WebChat Integration Guide

Welcome to the WebChat integration documentation! This guide explains how to seamlessly embed our live chat support into your platform.

## Overview
Our integration uses a **Username-Only** authentication model. You do **not** need to collect or pass your users' phone numbers or email addresses to us. As long as you provide a unique username (with no spaces), we will automatically create a dedicated chat room for that user or load their existing chat history.

---


## Prerequisites
1. **API Key:** You must obtain your unique `x-api-key` from your account manager or platform dashboard.
2. **Username (`name`):** The unique identifier for the user on your system. 
   - **MUST be at least 2 characters long.**
   - **MUST NOT contain any spaces.**

---

## Option 1: Secure Session Token Flow (Recommended)
For production environments, we highly recommend the session token flow. This ensures your API key is never exposed to the public browser.

### Step 1: Generate a Session Token (Your Backend)
When a user logs into your website, your backend server should make an API call to our server to generate a single-use session token.

**Endpoint:** `POST https://api.yourchatdomain.com/api/v1/platforms/session-token`

**Headers:**
- `Content-Type: application/json`
- `x-api-key: your_platform_api_key_here`

**Body:**
```json
{
  "name": "unique_username_without_spaces"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionToken": "a1b2c3d4e5f6g7h8..."
  }
}
```

### Step 2: Embed the Chat Widget (Your Frontend)
Once your backend receives the `sessionToken`, pass it to your frontend and embed the chat iframe.

```html
<!-- The Chat iframe -->
<iframe 
  src="https://chat.yourchatdomain.com/user/chats?sessionToken=YOUR_GENERATED_TOKEN" 
  width="400" 
  height="600" 
  style="border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
  allow="camera; microphone; fullscreen">
</iframe>
```
*Note: The session token is single-use and expires shortly after generation. It securely logs the user into their specific chat room.*

---

## Option 2: Basic API Key Flow (Quick Start / Testing)
If you want to quickly test the integration without backend changes, you can pass the API key directly via the iframe URL. 

> **WARNING:** This exposes your API key in the HTML source code. Only use this for internal testing or secure intranet applications.

```html
<iframe 
  src="https://chat.yourchatdomain.com/user/chats?apiKey=YOUR_API_KEY&name=unique_username_without_spaces&autoLogin=true" 
  width="400" 
  height="600" 
  style="border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
  allow="camera; microphone; fullscreen">
</iframe>
```

---

## Session Management (Clearing Sessions)
To ensure a great user experience and prevent cross-user session bleeding (especially if your app supports multiple accounts on the same computer), you should instruct the chat iframe to securely clear its session whenever the chat widget is closed or the parent page is refreshed.

You can do this by sending a `LOGOUT_CHAT` message to the iframe right before it is hidden or removed.

### Example Implementation:

```javascript
// Get a reference to the iframe element
const chatIframe = document.getElementById('chat-iframe');

// 1. Clear session when closing the widget
function closeChat() {
  if (chatIframe.contentWindow) {
    chatIframe.contentWindow.postMessage({ type: 'LOGOUT_CHAT' }, '*');
  }
  
  // Add a tiny delay before hiding/removing the iframe so the message sends successfully
  setTimeout(() => {
    document.getElementById('chat-overlay').style.display = 'none';
    chatIframe.src = ''; 
  }, 50);
}

// 2. Clear session when the user refreshes or leaves your website
window.addEventListener('beforeunload', () => {
  if (chatIframe && chatIframe.contentWindow) {
    chatIframe.contentWindow.postMessage({ type: 'LOGOUT_CHAT' }, '*');
  }
});
```

---

## Common Errors & Troubleshooting

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `"Username cannot contain spaces"` | The `name` provided contains a space. | Remove spaces or replace them with underscores (e.g., `John_Doe`). |
| `"Name (username) is required"` | The `name` field was omitted or empty. | Ensure you pass a valid `name`. |
| `"Invalid API key format"` | The API key is missing or corrupted. | Ensure the key starts with `pk_` and matches your dashboard exactly. |
| `"Platform not found"` / Invalid Key | Your API key was revoked or your account is inactive. | Contact support to regenerate your API key. |

---

## Support
If you encounter any issues during integration, please reach out to your designated account manager with the error payload you are receiving.
