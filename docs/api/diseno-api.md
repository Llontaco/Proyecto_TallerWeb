# Diseño de la API REST de SIGSU

La API está documentada con OpenAPI 3 y se puede probar desde Swagger UI:
`/swagger-ui.html` (especificación en `/v3/api-docs`).

## Recursos y rutas

| Recurso | Rutas | Verbos |
|---|---|---|
| Sesión | `/api/auth/login`, `/registro`, `/logout`, `/me`, `/password` | POST, GET, PUT |
| Solicitudes | `/api/solicitudes`, `/api/solicitudes/{id}` | GET, POST, PUT, DELETE |
| Subrecursos de una solicitud | `/{id}/estado`, `/{id}/asignacion`, `/{id}/comentarios`, `/{id}/evidencias[/{evidenciaId}]` | PATCH, POST, GET |
| Notificaciones | `/api/notificaciones`, `/{id}/leida`, `/leidas` | GET, PATCH |
| Catálogos | `/api/catalogos`, `/api/categorias[/{id}]`, `/api/prioridades[/{id}]`, `/api/areas` | GET, POST, PUT, DELETE |
| Usuarios | `/api/usuarios[/{id}]` | GET, PATCH |
| Indicadores | `/api/dashboard?desde=&hasta=` | GET |

**Convenciones**
- Sustantivos en plural para colecciones; el identificador va en la ruta (`/solicitudes/{id}`).
- Filtros y rangos como parámetros de consulta (`?estado=REGISTRADA&categoriaId=1&q=proyector`).
- `PUT` reemplaza los datos editables; `PATCH` cambia una sola característica (estado, asignación, lectura).
- `POST` de creación responde `201 Created` con la cabecera `Location`.
- Errores con un JSON uniforme: `{status, error, mensaje, errores{campo: mensaje}, ruta, timestamp}`.

## Códigos HTTP usados

| Código | Cuándo |
|---|---|
| 200 / 201 / 204 | Consulta correcta / recurso creado / acción sin contenido |
| 400 | Validación fallida (incluye el campo con error) |
| 401 | Sin sesión, token inválido o expirado, credenciales incorrectas |
| 403 | El rol no tiene permiso o la solicitud no es del usuario |
| 404 | Recurso inexistente |
| 409 | Conflicto (categoría duplicada o en uso, correo ya registrado) |
| 422 | Regla de negocio (transición de estado no permitida) |
| 429 | Demasiadas peticiones (gateway) o demasiados intentos fallidos de login (API) |

## API Gateway

En producción el contenedor **nginx** del frontend cumple el rol de API Gateway:

- **Punto de entrada único:** sirve la SPA y enruta `/api/**`, `/swagger-ui` y `/v3/api-docs` hacia el backend.
- **Límite de peticiones por IP:** 20 por minuto en `/api/auth/login` (fuerza bruta) y 30 por segundo en el resto (`429`).
- **Cabeceras de seguridad:** CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Health check** propio en `/health` y ocultamiento de la versión del servidor.

Para un escenario con muchos microservicios, la evolución natural sería un gateway dedicado (Spring Cloud Gateway, Kong o AWS API Gateway) con autenticación centralizada, cuotas por cliente y versionado.

## Panorama: REST frente a GraphQL, gRPC y webhooks

| Estilo | Cómo funciona | Ventajas | Desventajas | ¿Aplica a SIGSU? |
|---|---|---|---|---|
| **REST** (elegido) | Recursos con URLs y verbos HTTP; JSON | Simple, cacheable, estándar del curso, fácil de documentar (OpenAPI) y probar (Postman) | Puede requerir varias llamadas para una vista compleja | **Sí:** CRUD claro, pocos clientes |
| **GraphQL** | Un solo endpoint; el cliente pide exactamente los campos que necesita | Evita sobrecarga de datos; ideal para apps móviles con muchas vistas | Más complejo de asegurar (consultas costosas), caché difícil | Posible en el futuro para una app móvil |
| **gRPC** | Contratos Protocol Buffers sobre HTTP/2, binario | Muy rápido; streaming; ideal entre microservicios | No se usa directo desde el navegador; menos legible | No: hay un solo backend |
| **Webhooks** | El servidor llama a una URL del cliente cuando ocurre un evento | Integración en tiempo real con otros sistemas | Hay que firmar y reintentar los envíos | Sí, como mejora: avisar a otros sistemas (p. ej. mesa de ayuda de TI) cuando una solicitud cambia de estado |

Hoy las notificaciones de SIGSU ya siguen un modelo orientado a eventos: cada cambio publica un evento interno (`NotificacionCreada`) que se procesa después del commit. Agregar un webhook sería otro *listener* de ese mismo evento.

## Pruebas de la API

- **Automatizadas en Java:** `FlujoSolicitudIntegrationTest` y `SeguridadYNotificacionesIntegrationTest` (MockMvc).
- **Colección Postman/Newman:** `tests/api/sigsu.postman_collection.json` (32 peticiones, 50 aserciones) contra el stack en Docker; corre en CI.
- **Manuales:** `docs/api/sigsu.http` (extensión REST Client de VS Code) y Swagger UI.
