import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { SessionProvider } from './context/session-context';
import { ToastProviderInternal } from './hooks/use-toast';
import { Toaster } from './components/ui/toaster';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProviderInternal>
        <SessionProvider>
          <App />
          <Toaster />
        </SessionProvider>
      </ToastProviderInternal>
    </BrowserRouter>
  </React.StrictMode>
);
