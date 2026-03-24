import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { App as AntdApp } from 'antd'
import { store, persistor } from './redux/store.jsx'
import './index.css'
import App from './App.jsx'
import LoadingSpinner from './components/common/LoadingSpinner'

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
