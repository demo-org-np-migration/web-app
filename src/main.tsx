import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initAuth } from './auth';

// Nada se monta antes de tener sesión: el gateway solo nos manda tráfico de comercios
// logueados, pero el login-required de Keycloak es lo que de verdad lo garantiza.
initAuth()
  .then((authenticated) => {
    if (!authenticated) {
      throw new Error('keycloak no autenticó y no redirigió, algo está mal configurado');
    }

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error('fallo el init de keycloak', err);
  });
