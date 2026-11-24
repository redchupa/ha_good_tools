import { takeSharedToolId } from './utils/toolNavigation';
import { getToolById } from './data/tools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import App from './App';

const sharedId = takeSharedToolId();
if (sharedId && getToolById(sharedId)) location.hash = '/tool/' + sharedId;

// Clear a file input before its picker opens, so choosing the same file again (for example after
// cancelling) still fires a change event.
document.addEventListener('click', (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.type === 'file') target.value = '';
}, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
