# syntax=docker/dockerfile:1
# ---------- Etapa 1: build de React con Vite ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---------- Etapa 2: nginx sirve la SPA y actúa como API Gateway ----------
FROM nginx:1.29-alpine
LABEL org.opencontainers.image.title="sigsu-frontend" \
      org.opencontainers.image.description="Frontend React de SIGSU servido por nginx (gateway hacia la API)"

# La plantilla se procesa con envsubst al iniciar: BACKEND_URL define a dónde se envía /api
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/seguridad.conf /etc/nginx/snippets/seguridad.conf
COPY nginx/proxy.conf /etc/nginx/snippets/proxy.conf
COPY --from=build /app/dist /usr/share/nginx/html

ENV BACKEND_URL=http://backend:8080 \
    NGINX_ENVSUBST_FILTER=^BACKEND_URL$
EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/health || exit 1
