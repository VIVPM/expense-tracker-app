import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// Set deployed backend URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "https://expense-tracker-app-kzqi.onrender.com";

// Interceptor to remove the `/api` prefix since the deployed backend doesn't use it
axios.interceptors.request.use(config => {
  if (config.url && config.url.startsWith('/api')) {
    config.url = config.url.replace(/^\/api/, '');
  }
  return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
