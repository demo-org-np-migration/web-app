import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Server config: solo importa para `npm run dev`. En build/producción esta app no habla
// con nada directamente — nginx la sirve estática y el navegador pega contra el mismo
// origen (`/merchant/*`), que en el cluster resuelve Kong (las convenciones internas de API).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // El gateway rutea por Host header (las convenciones internas de API): `api.staging.cauri.local` va a
      // staging. Sin este header Kong no sabe a qué entorno mandar la request.
      '/merchant': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        headers: { Host: 'api.staging.cauri.local' },
      },
    },
  },
});
