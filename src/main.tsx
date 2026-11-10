import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { BriefProvider } from './state/BriefContext';
import { DraftsProvider } from './state/DraftsContext';
import { PicksProvider } from './state/PicksContext';
import { ReadoutProvider } from './state/ReadoutContext';
import { StatusProvider } from './state/StatusContext';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <BriefProvider>
        <PicksProvider>
          <DraftsProvider>
            <StatusProvider>
              <ReadoutProvider>
                <App />
              </ReadoutProvider>
            </StatusProvider>
          </DraftsProvider>
        </PicksProvider>
      </BriefProvider>
    </BrowserRouter>
  </StrictMode>,
);
