import { React } from './lib/html.js';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client?bundle';
import { BrowserRouter } from 'https://esm.sh/react-router-dom@6.22.3?bundle';
import App from './pages/app.js';
import { SessionProvider } from './context/session-context.js';
import { ToastProvider } from './hooks/toast.js';
import Toaster from './components/toaster.js';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  React.createElement(React.StrictMode, null,
    React.createElement(BrowserRouter, null,
      React.createElement(ToastProvider, null,
        React.createElement(SessionProvider, null,
          React.createElement(App, null),
          React.createElement(Toaster, null)
        )
      )
    )
  )
);
