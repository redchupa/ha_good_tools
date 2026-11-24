import { sharedToolId } from './utils/toolNavigation';
import { getToolById } from './data/tools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import App from './App';

const sharedId = sharedToolId();
if (sharedId && getToolById(sharedId)) location.hash = '/tool/' + sharedId;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
