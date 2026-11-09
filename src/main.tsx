import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { BriefProvider } from './state/BriefContext';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <BriefProvider>
        <App />
      </BriefProvider>
    </BrowserRouter>
  </StrictMode>,
);
