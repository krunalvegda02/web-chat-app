import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { App as AntdApp } from 'antd'
import { store, persistor } from './redux/store.jsx'
import './index.css'
import App from './App.jsx'
import LoadingSpinner from './components/common/LoadingSpinner'

// Strip sensitive URL params immediately — before React renders anything.
// Values are already captured by the browser for this page load;
// this only removes them from the visible URL bar and browser history.
;(function stripSensitiveParams() {
  const SENSITIVE = ['apiKey', 'key', 'api_key', 'name', 'email', 'phone',
                     'autoLogin', 'auto', 'platform', 'userId', 'sessionToken', 'st'];
  const url = new URL(window.location.href);
  let changed = false;
  const captured = {};
  SENSITIVE.forEach(p => {
    if (url.searchParams.has(p)) {
      captured[p] = url.searchParams.get(p);
      url.searchParams.delete(p);
      changed = true;
    }
  });
  if (changed) {
    // Save captured params so React can still read them
    sessionStorage.setItem('__platformParams', JSON.stringify(captured));
    const clean = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '');
    window.history.replaceState(window.history.state, '', clean);
  }
})();

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner fullScreen />} persistor={persistor}>
        <AntdApp>
          <App />
        </AntdApp>
      </PersistGate>
    </Provider>
  // </StrictMode>,
)
