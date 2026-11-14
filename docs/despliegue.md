# Despliegue y ambientes de SIGSU

SIGSU se ejecuta en tres ambientes con la misma imagen Docker; solo cambian las variables de entorno.

| Ambiente | Dónde corre | Base de datos | Perfil Spring | Datos demo | Cookie `Secure` |
|---|---|---|---|---|---|
| **Desarrollo** | Máquina del integrante (`mvn spring-boot:run` + `npm run dev`) | MySQL local | `dev` | Sí | No |
| **Prueba** | GitHub Actions (CI) y `docker compose` local | H2 en memoria (unitarias/integración) y MySQL 8.4 en contenedor (API y E2E) | `test` / `prod` | Sí | No |
| **Producción** | Nube (Render) | MySQL gestionado (Aiven o Railway) | `prod` | Opcional | Sí (HTTPS) |

## Arquitectura de despliegue

```
Navegador ──HTTPS──► sigsu-frontend (nginx: SPA + API Gateway) ──HTTPS──► sigsu-backend (Spring Boot) ──TLS──► MySQL gestionado
                     · límite de peticiones (429)                       · JWT, roles, validación
                     · cabeceras de seguridad (CSP, X-Frame-Options)     · /actuator/health
```

El navegador solo habla con el gateway: un único origen, la cookie `SameSite=Strict` funciona y no se necesita CORS.

## Pipeline CI/CD (GitHub Actions)

| Workflow | Cuándo | Qué hace |
|---|---|---|
| `ci.yml` | Cada push y pull request | Backend: `mvn verify` (51 pruebas + cobertura ≥ 60 %). Frontend: Vitest (25 pruebas), build y `npm audit`. Integración: `docker compose up`, Newman (32 peticiones, 50 aserciones) y Playwright (8 pruebas E2E) |
| `cd.yml` | CI exitoso en `main` o tag `v*` | Construye y publica las imágenes en GitHub Container Registry, dispara el despliegue en Render y verifica que la aplicación responda |
| `codeql.yml` | Push/PR a `main` o `develop` y cada lunes | Análisis estático de seguridad (SAST) de Java y JavaScript |
| `dependabot.yml` | Semanal | Abre PR con dependencias actualizadas (Maven, npm, Docker, Actions) |

## Paso a paso: primer despliegue en la nube

### 1. Base de datos MySQL gestionada (gratuita)

**Opción A – Aiven (recomendada, plan gratuito):**
1. Crear cuenta en https://aiven.io y un servicio *MySQL* en el plan *Free*.
2. Copiar host, puerto, usuario y contraseña del servicio.
3. La URL JDBC queda así:
   `jdbc:mysql://HOST:PUERTO/defaultdb?sslMode=REQUIRED&serverTimezone=UTC`

**Opción B – Railway:** crear un proyecto con el plugin *MySQL* y usar las variables `MYSQLHOST`, `MYSQLPORT`, etc.

### 2. Servicios web en Render

1. Subir el repositorio a GitHub (rama `main`).
2. En https://render.com → **New → Blueprint** → elegir el repositorio. Render lee `render.yaml` y crea `sigsu-backend` y `sigsu-frontend`.
3. Completar las variables marcadas como *sync: false*:

| Servicio | Variable | Valor |
|---|---|---|
| sigsu-backend | `DB_URL` | URL JDBC del paso 1 |
| sigsu-backend | `DB_USER` / `DB_PASSWORD` | Credenciales de MySQL |
| sigsu-backend | `SEED_DEMO_PASSWORD` | Contraseña de los usuarios demo (letras y números) |
| sigsu-backend | `APP_URL_FRONTEND` y `CORS_ORIGINS` | `https://sigsu-frontend.onrender.com` |
| sigsu-frontend | `BACKEND_URL` | `https://sigsu-backend.onrender.com` |

`JWT_SECRET` lo genera Render automáticamente.

### 3. Conectar el pipeline de CD

En GitHub → *Settings → Secrets and variables → Actions*:

| Tipo | Nombre | Valor |
|---|---|---|
| Secret | `RENDER_DEPLOY_HOOK_BACKEND` | *Deploy hook* de sigsu-backend (Render → Settings) |
| Secret | `RENDER_DEPLOY_HOOK_FRONTEND` | *Deploy hook* de sigsu-frontend |
| Variable | `APP_URL` | `https://sigsu-frontend.onrender.com` |

Desde ese momento, cada merge a `main` que pase CI se despliega solo.

> El plan gratuito de Render suspende el servicio tras 15 minutos sin uso; la primera visita después tarda ~1 minuto en despertar. Antes de la sustentación conviene abrir la aplicación unos minutos antes.

## Ejecutar el stack completo en local (ambiente de prueba)

```bash
cp .env.example .env      # completar contraseñas y JWT_SECRET
docker compose up -d --build --wait
# Aplicación: http://localhost:8088   ·   Swagger: http://localhost:8088/swagger-ui.html
npx newman run tests/api/sigsu.postman_collection.json -e tests/api/local.postman_environment.json
cd tests/e2e && npm ci && npx playwright install chromium && npx playwright test
docker compose down        # agregar -v para borrar también la base de datos
```
