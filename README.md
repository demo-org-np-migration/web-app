# web-app

El portal de comercios de Cauri. Un comercio se loguea con Keycloak, ve el estado de su cuenta y
sus últimos cobros, y puede crear uno nuevo. Nada más — no movemos plata acá, solo se la pedimos a
`merchant-portal-bff`.

Somos el equipo **channels**. Dueña del código: Sofía Quiroga.

## Qué hace

Dos pantallas:

- **Dashboard** (`GET /merchant/dashboard`): nombre del comercio, saldo de su cuenta y la tabla de
  cobros recientes.
- **Nuevo cobro** (`POST /merchant/charges`): un form con la cuenta a debitar, monto, moneda y
  referencia.

Todo pasa por `merchant-portal-bff`, nunca directo contra `payments-api` o `accounts-api` — el
token que tenemos es del client público `merchant-portal` (rol `merchant`), y son los servicios de
service-to-service los que necesitan credenciales que una SPA no puede guardar. `src/api.ts` pega
siempre al mismo origen (`/merchant/*`); quién resuelve eso a dónde ya no es problema nuestro: en
el cluster lo hace Kong (`las convenciones internas de API` sección 8), en tu laptop el proxy de Vite.

## Corriendo local

Necesitás el gateway local levantado (`http://localhost:8000`, ver `docs/LEVANTAR-TODO.md` del lab)
y Keycloak con el realm `cauri-staging` importado. Con eso:

```bash
npm install
npm run dev
```

Vite sirve en `http://localhost:5173` y proxea `/merchant/*` a `http://localhost:8000` agregando el
header `Host: api.staging.cauri.local` (ver `vite.config.ts`) — sin ese header Kong no sabe que la
request es para staging y no la rutea a ningún lado. Si te aparece un 404 rarísimo en vez de un 401,
mirá primero si el proxy está mandando el Host correcto antes de sospechar del BFF.

El login es contra el realm real: usá `bruno.comercio` / `cauri123` (es el usuario semilla con rol
`merchant`, `las convenciones internas de API` sección 13).

## Variables de build

Nada de esto es configurable en runtime. `VITE_KEYCLOAK_URL` y `VITE_KEYCLOAK_REALM` los lee Vite
al buildear y quedan horneados en el JS que termina en el bundle — cambiarlos implica rebuildear la
imagen, no tocar un ConfigMap:

| Variable | Local (`.env.local`, opcional) | Imagen `-staging` | Imagen `-prod` |
|---|---|---|---|
| `VITE_KEYCLOAK_URL` | `http://keycloak.platform.svc:8180` | `http://keycloak.platform.svc:8180` | `http://keycloak.platform.svc:8180` |
| `VITE_KEYCLOAK_REALM` | `cauri-staging` | `cauri-staging` | `cauri-prod` |

`8180` es el puerto que k3d mapea a la laptop (`8180→8080` del cluster); el issuer que termina
adentro del token siempre es el interno con `:8080`, así que si algún día ves un mismatch de
issuer en vez de mirar acá primero, mirá el realm JSON de Keycloak.

`build.yml` arma **dos imágenes** en cada push a `main` (`sha-<7>-staging` y `sha-<7>-prod`), cada
una con su `VITE_KEYCLOAK_REALM` pasado como `--build-arg` al Dockerfile. Si necesitás una imagen
con otro realm para probar algo puntual, es lo mismo: `docker build --build-arg
VITE_KEYCLOAK_REALM=<realm> --build-arg VITE_KEYCLOAK_URL=<url> .`

## Tests

```bash
npm test
```

Un test de render de `Dashboard` con `api` mockeada — no queremos que un merchant real, ni
siquiera el de staging, dependa de que corra un `merchant-portal-bff` para que el CI nos diga si
rompimos algo.

## Deployments

**No se deploya desde acá.** Estilo GitOps (C): `build.yml` buildea y pushea las dos imágenes a
`ghcr.io/demo-org-np-migration/web-app`, y bumpea `image.tag` en el repo `gitops`
(`apps/web-app/values-staging.yaml` con el tag `-staging` en cada push a `main`, `values-prod.yaml`
con el tag `-prod` cuando taggeamos `v*`). Argo CD sincroniza desde ahí.

El chart vive en `chart/`. Es una sola réplica de nginx sirviendo estático — no hay nada que
autoescalar ni un `ConfigMap` que montar, así que el chart no trae ninguno de los dos.

## Salud

`GET /health` en nginx devuelve `{"status":"ok"}` sin tocar nada más — no depende de que
`merchant-portal-bff` esté arriba. Si el pod está `Ready` pero el dashboard no carga, el problema
está del otro lado del fetch, no acá.

No hay `/metrics`: es una SPA servida por un nginx sin exporter, no la contamos como "app sin
telemetría a propósito" (no es una decisión, es que no hay nada corriendo del lado del server que
valga la pena instrumentar).
