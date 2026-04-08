import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

import './styles/globals.css';
import { i18nReady } from './i18n';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

void i18nReady.then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
