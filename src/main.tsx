import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeContext, useThemeState } from './hooks/useTheme';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      console.debug('[ServiceWorker] unregistering old registration', registration.scope);
      registration.unregister();
    });
  }).catch((error) => {
    console.warn('[ServiceWorker] failed to unregister', error);
  });
}

function Root() {
  const themeValue = useThemeState();
  return (
    <ThemeContext.Provider value={themeValue}>
      <App />
    </ThemeContext.Provider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
