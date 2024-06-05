# syntax=docker/dockerfile:1

# --- build ---
FROM node:20-alpine AS build
WORKDIR /app

# El realm y la URL de Keycloak quedan horneados en el bundle de JS: no son env vars que se
# puedan cambiar en runtime, así que build.yml arma DOS imágenes (staging y prod) con estos
# ARGs distintos (ver README, "Variables de build").
ARG VITE_KEYCLOAK_REALM=cauri-staging
ARG VITE_KEYCLOAK_URL=http://keycloak.platform.svc:8180
ENV VITE_KEYCLOAK_REALM=${VITE_KEYCLOAK_REALM}
ENV VITE_KEYCLOAK_URL=${VITE_KEYCLOAK_URL}

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# --- runtime ---
# Imagen ya corre como usuario no root (uid 101) y escucha 8080 por defecto.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/health || exit 1
