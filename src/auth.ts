import Keycloak from 'keycloak-js';

// Client público `merchant-portal`, rol `merchant` (las convenciones internas de API). PKCE porque es una SPA
// sin backend propio que guarde un client secret.
//
// `VITE_KEYCLOAK_URL` y `VITE_KEYCLOAK_REALM` se inyectan en build time (ver README, sección
// "Variables de build") — no son configurables en runtime, así que si cambian hay que rebuildear
// la imagen, no solo el ConfigMap.
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: 'merchant-portal',
});

let initialized: Promise<boolean> | null = null;

export function initAuth(): Promise<boolean> {
  if (!initialized) {
    initialized = keycloak.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });
  }
  return initialized;
}

export function getToken(): string | undefined {
  return keycloak.token;
}

export function logout(): void {
  keycloak.logout({ redirectUri: window.location.origin });
}

export function getMerchantId(): string | undefined {
  // El BFF saca el merchant_id de este mismo claim del lado del server (las convenciones internas de API,
  // "merchant-portal-bff"). Acá lo mostramos nomás para la UI; no se manda en el body de
  // ninguna request, viaja implícito en el token.
  return (keycloak.tokenParsed as { merchant_id?: string } | undefined)?.merchant_id;
}

export default keycloak;
