# SIGSU – Sistema Integral de Gestión de Servicios Universitarios

Aplicación web full-stack para registrar, asignar, atender y monitorear solicitudes de servicios universitarios
(mantenimiento, infraestructura, soporte informático, trámites administrativos y reservas de ambientes).

Curso: Taller de Construcción de Software Web · Estado: **Fase III – Release Candidate v0.3.0**

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
[![CodeQL](../../actions/workflows/codeql.yml/badge.svg)](../../actions/workflows/codeql.yml)

## Equipo

| Integrante | Rol |
|---|---|
| Garcia Rosales Mathias Sebastian | Líder de proyecto / Product Owner |
| Llontop Falcón Henry Alessandro | Analista de requerimientos |
| Varillas Saldaña Anderson Alexis | Analista funcional / QA |
| Rosales Rojas Cesar Christopher | Arquitecto de software / Backend |
| Romero Cuyubamaba Fernando Gael | Diseñador UI/UX / Frontend |

## Arquitectura

```
Navegador ──► nginx (SPA React + API Gateway) ──► API REST Spring Boot ──JPA──► MySQL
               límite de peticiones, CSP          Controller → Service → Repository
```

| Carpeta | Contenido |
|---|---|
| `backend/` | API REST Spring Boot 3.4 (Java 21): JWT, roles, validaciones, notificaciones, JPA, Dockerfile |
| `frontend/` | SPA React 18 + React Router, pruebas Vitest, Dockerfile y configuración nginx (gateway) |
| `tests/api/` | Colección Postman/Newman (32 peticiones) |
| `tests/e2e/` | Pruebas end-to-end con Playwright (escritorio y celular) |
| `.github/` | Pipelines CI, CD y CodeQL; Dependabot; plantilla de pull request |
| `docs/` | Especificaciones BDD, diseño de la API, seguridad OWASP, despliegue y registro de uso de IA |
| `prototipo/` | Prototipo de la Fase I |

## Opción 1: todo con Docker (recomendado)

Requisitos: Docker Desktop.

```bash
cp .env.example .env              # completar contraseñas, JWT_SECRET y SEED_DEMO_PASSWORD
docker compose up -d --build --wait
```

- Aplicación: http://localhost:8088
- Documentación de la API (Swagger): http://localhost:8088/swagger-ui.html

## Opción 2: desarrollo local

Requisitos: Java 21, Maven 3.9, Node.js 20 y MySQL 8 o superior.

```bash
cd backend && cp .env.example .env && mvn spring-boot:run     # http://localhost:8080
cd frontend && npm install && npm run dev                      # http://localhost:5173
```

### Usuarios de demostración

La contraseña es la definida en `SEED_DEMO_PASSWORD`.

| Correo | Rol |
|---|---|
| estudiante@uni.edu.pe / docente@uni.edu.pe | Solicitante |
| tecnico@uni.edu.pe / tecnico2@uni.edu.pe | Técnico |
| supervisor@uni.edu.pe | Supervisor |
| admin@uni.edu.pe | Administrador |

## Pruebas

| Nivel | Herramienta | Cantidad | Comando |
|---|---|---|---|
| Unitarias + integración backend | JUnit 5, Mockito, MockMvc (H2) | 51 · cobertura 74 % (mínimo 60 %) | `cd backend && mvn verify` |
| Unitarias frontend | Vitest + Testing Library | 25 | `cd frontend && npm test` |
| API | Postman / Newman | 32 peticiones · 50 aserciones | `npx newman run tests/api/sigsu.postman_collection.json -e tests/api/local.postman_environment.json` |
| End-to-end | Playwright | 8 (escritorio y celular) | `cd tests/e2e && npm ci && npx playwright test` |

Todas corren automáticamente en GitHub Actions en cada push y pull request.

## CI/CD y despliegue

- **CI** (`ci.yml`): compila, prueba, mide cobertura, audita dependencias y ejecuta las pruebas de API y E2E sobre el stack en Docker.
- **CD** (`cd.yml`): con CI en verde en `main`, publica las imágenes en GitHub Container Registry y despliega en Render.
- **CodeQL** (`codeql.yml`): análisis estático de seguridad (SAST).
- Ambientes, variables y pasos de despliegue: [docs/despliegue.md](docs/despliegue.md).
- Flujo de ramas y commits: [CONTRIBUTING.md](CONTRIBUTING.md).

## Documentación

- [Diseño de la API, API Gateway y panorama GraphQL/gRPC/webhooks](docs/api/diseno-api.md)
- [Seguridad y OWASP Top 10](docs/seguridad.md)
- [Despliegue y ambientes](docs/despliegue.md)
- [Escenarios BDD](docs/specs/)
- [Registro de uso de IA](docs/registro-uso-ia.md)
