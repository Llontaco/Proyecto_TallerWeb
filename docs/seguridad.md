# Seguridad de SIGSU (Fase III)

## Controles frente al OWASP Top 10 (2021)

| Riesgo OWASP | Control implementado | Dónde | Evidencia |
|---|---|---|---|
| **A01 Control de acceso roto** | Rol verificado en cada endpoint (`@PreAuthorize`); dueño o técnico asignado verificado en cada solicitud; las acciones permitidas las calcula el backend | `SecurityConfig`, `SolicitudService.puedeVer/puedeEditar` | `ReglasAccesoTest`, integración: estudiante → 403 en solicitud ajena y en dashboard |
| **A02 Fallas criptográficas** | Contraseñas con BCrypt; JWT firmado HMAC con clave ≥ 256 bits; HTTPS en producción; cookie `Secure` | `SecurityConfig`, `JwtService`, perfil `prod` | `JwtServiceTest` |
| **A03 Inyección** | Consultas con JPA/Criteria (parámetros enlazados, sin SQL concatenado); validación con Bean Validation; React escapa el HTML | Repositorios, DTO | Pruebas 400 por campo |
| **A04 Diseño inseguro** | Flujo de estados centralizado en `EstadoSolicitud`; reglas de negocio en el servicio, no en el cliente | `EstadoSolicitud` | `EstadoSolicitudTest` (12 casos) |
| **A05 Configuración insegura** | Sin trazas en errores; Actuator solo expone `health` e `info`; CSP y cabeceras en el gateway; contenedores sin root | `GlobalExceptionHandler`, nginx, Dockerfiles | `curl -I` muestra CSP y `X-Frame-Options` |
| **A06 Componentes vulnerables** | `npm audit` en CI, Dependabot semanal, CodeQL. Se actualizó React Router 6.28 → 6.30.6 por dos vulnerabilidades altas (open redirect/XSS) | `ci.yml`, `dependabot.yml` | Pipeline |
| **A07 Fallas de autenticación** | Bloqueo tras 5 intentos fallidos en 15 min (429); límite por IP en el gateway; mensaje genérico ante credenciales incorrectas; política de contraseñas (letras y números, mín. 8) | `LoginAttemptService`, nginx | `LoginAttemptServiceTest`, integración 429, Newman |
| **A08 Integridad de datos/software** | Imágenes construidas en CI desde el código revisado; versiones de dependencias fijadas | `cd.yml` | GHCR |
| **A09 Registro y monitoreo** | Logs de inicio de sesión, intentos fallidos y cambios de estado (sin datos sensibles) | Servicios | Logs del contenedor |
| **A10 SSRF** | El backend no hace peticiones a URLs que envía el usuario | — | — |

## Gestión de secretos

- Ningún secreto está en el código ni en el repositorio: `.env` y `backend/.env` están en `.gitignore`.
- Cada ambiente recibe sus secretos por variables de entorno: archivo `.env` local, *GitHub Secrets* en CI/CD y variables del proveedor cloud en producción.
- En CI las contraseñas y el `JWT_SECRET` se generan aleatoriamente en cada ejecución.
- El backend se niega a iniciar si falta `JWT_SECRET` o si tiene menos de 256 bits.

## Archivos subidos (evidencias)

Solo JPG, PNG o PDF de hasta 5 MB, verificados por extensión y por la firma real del archivo; se guardan con un nombre UUID generado en el servidor y nunca se usa el nombre del cliente como ruta (protección contra *path traversal*). Se descargan con `X-Content-Type-Options: nosniff`.

## Riesgos aceptados y pendientes

| Riesgo | Decisión |
|---|---|
| 2 vulnerabilidades moderadas en React Router 6 que solo se corrigen en la versión 7 (cambio mayor) | Aceptado para el Release Candidate; la migración queda planificada |
| El bloqueo de login se guarda en memoria (se pierde al reiniciar y no se comparte entre réplicas) | Aceptado: hay una sola réplica. Con más réplicas se movería a Redis |
| Sin CSRF token | Mitigado con cookie `SameSite=Strict` y API que solo acepta JSON |
| Pruebas DAST (OWASP ZAP) | Programadas para la Fase IV |
