import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SecurityHeaders, SessionManager } from './utils/security';

// Apply security headers and enforce HTTPS
SecurityHeaders.applyCSP();
SecurityHeaders.enforceHTTPS();

// Initialize session
SessionManager.initSession();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);