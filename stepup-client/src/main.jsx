import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        gutter={12}
        containerStyle={{ bottom: 24, right: 24 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#12121A',
            color: '#F0F0FF',
            border: '1px solid #1E1E2E',
            borderRadius: '12px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.875rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          },
          success: {
            iconTheme: { primary: '#43E97B', secondary: '#0A0A0F' },
            style: {
              borderColor: 'rgba(67,233,123,0.25)',
            },
          },
          error: {
            iconTheme: { primary: '#FF6584', secondary: '#0A0A0F' },
            style: {
              borderColor: 'rgba(255,101,132,0.25)',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
