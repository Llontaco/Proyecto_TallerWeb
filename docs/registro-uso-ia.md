# Registro de uso de IA – SIGSU

Cada uso significativo de IA se registra aquí. Reglas del equipo:

1. Nada generado por IA entra al repositorio sin revisión de otro integrante.
2. Nunca se comparten con la IA contraseñas, tokens, datos personales reales ni archivos `.env`.
3. Las pruebas generadas por IA se ejecutan y se revisan contra el criterio de aceptación.
4. Quien entrega un código debe poder explicarlo en la sustentación.

## Fase I – Análisis, especificación y prototipo

| # | Fecha | Herramienta | Prompt (resumen) | Resultado generado | ¿Se utilizó? | Validación realizada | Modificaciones | Responsable |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-10-17 | Claude | Proponer la estructura del documento de Fase I a partir del enunciado del curso | Esquema de secciones | Parcialmente | Comparado contra los 12 entregables del enunciado | 4 | Garcia Rosales Mathias Sebastian |
| 2 | 2026-10-17 | Claude | Redactar requerimientos funcionales y no funcionales medibles | Tablas RF/RNF | Parcialmente | Revisión en reunión de equipo | 6 | Llontop Falcón Henry Alessandro |
| 3 | 2026-10-17 | Claude | Generar escenarios BDD en Gherkin para las 18 historias | Archivos `.feature` | Parcialmente | Contrastados con el ejemplo del enunciado y con el prototipo | 3 | Varillas Saldaña Anderson Alexis |
| 4 | 2026-10-17 | Claude | Proponer modelo entidad-relación para solicitudes | Lista de entidades y relaciones | Parcialmente | Normalización revisada a mano (3FN) | 5 | Rosales Rojas Cesar Christopher |
| 5 | 2026-10-17 | Claude | Generar prototipo HTML/CSS/JS con API simulada mediante fetch | Código del prototipo | Sí | Prueba automática del flujo (14 casos) y pruebas manuales en Chrome y móvil | 8 | Romero Cuyubamaba Fernando Gael |

## Fase II – Construcción full stack (MVP)

| # | Fecha | Herramienta | Prompt (resumen) | Resultado generado | ¿Se utilizó? | Validación realizada | Modificaciones | Responsable |
|---|---|---|---|---|---|---|---|---|
| 6 | 2026-10-17 | Claude | Generar el backend Spring Boot por capas (entidades, servicios, controladores, DTO, seguridad JWT) | Código Java | Parcialmente | Compilación, 21 pruebas automatizadas y 19 llamadas manuales a la API | [__] | Rosales Rojas Cesar Christopher |
| 7 | 2026-10-17 | Claude | Migrar el prototipo a componentes React con React Router | Código JSX | Parcialmente | Prueba end-to-end en navegador (11 verificaciones) | [__] | Romero Cuyubamaba Fernando Gael |
| 8 | 2026-10-17 | Claude | Generar pruebas unitarias y de integración del flujo de solicitudes | Pruebas JUnit/MockMvc | Sí | Revisadas contra los escenarios BDD de HU-05, HU-10, HU-11 y HU-15 | [__] | Varillas Saldaña Anderson Alexis |
| 9 | 2026-10-17 | Claude | Diagnosticar por qué el login no aceptaba texto en la prueba automática | Diagnóstico | Sí | Se comprobó que era el aviso de guardar contraseña del navegador de prueba, no la app | 1 | Llontop Falcón Henry Alessandro |

## Fase III – APIs, nube, DevOps y seguridad

| # | Fecha | Herramienta | Prompt (resumen) | Resultado generado | ¿Se utilizó? | Validación realizada | Modificaciones | Responsable |
|---|---|---|---|---|---|---|---|---|
| 10 | 2026-11-13 | Claude | Generar Dockerfiles multi-etapa, docker-compose y configuración nginx como API Gateway | Archivos de infraestructura | Parcialmente | Stack levantado con `docker compose up --wait`; health checks en verde; prueba de límite de peticiones (14 de 25 intentos → 429) | [__] | Rosales Rojas Cesar Christopher |
| 11 | 2026-11-13 | Claude | Generar pipelines de GitHub Actions (CI, CD, CodeQL) y Dependabot | Workflows YAML | Parcialmente | Revisión de permisos mínimos y uso de secretos; ejecución en GitHub | [__] | Garcia Rosales Mathias Sebastian |
| 12 | 2026-11-13 | Claude | Generar pruebas unitarias e integración (bloqueo de login, notificaciones, JWT, evidencias, reglas de acceso) | 30 pruebas JUnit | Sí | Revisión contra los escenarios BDD; cobertura 74 % | [__] | Varillas Saldaña Anderson Alexis |
| 13 | 2026-11-13 | Claude | Generar pruebas de frontend (Vitest), colección Newman y pruebas E2E (Playwright) | 25 + 32 + 8 pruebas | Sí | Ejecutadas contra el stack en Docker; ver revisión abajo | [__] | Romero Cuyubamaba Fernando Gael |
| 14 | 2026-11-13 | Claude | Implementar notificaciones (HU-13), bloqueo por intentos fallidos y política de contraseñas | Código Java y React | Parcialmente | Pruebas automatizadas + revisión de OWASP A07 | [__] | Llontop Falcón Henry Alessandro |

### Revisión de las pruebas generadas por IA

Las pruebas generadas no se aceptaron solo porque "pasaban": se revisó qué validaban y se corrigieron estos casos.

| Prueba | Problema encontrado en la revisión | Corrección |
|---|---|---|
| Newman "Sin token → 401" | Fallaba porque Newman reutiliza la cookie del login anterior: en realidad la petición sí estaba autenticada. La prueba no medía lo que decía | Se movió antes de los logins, cuando todavía no hay cookie |
| Playwright "celular" | Se ejecutaba también con el tamaño de escritorio, donde la barra lateral siempre es visible | Se restringió al proyecto `movil` |
| JaCoCo / cobertura | Se excluyeron `SigsuApplication` y `DataInitializer` de la medición para no inflar la cifra con código de arranque | Regla explícita en `pom.xml` |
| Auditoría `npm audit` | Detectó dos vulnerabilidades altas reales en React Router 6.28 | Actualización a 6.30.6 y registro del riesgo aceptado en `docs/seguridad.md` |

> Completar las columnas "Modificaciones" y "Validación" con lo que realmente hizo cada integrante antes de entregar.

## Plantilla para nuevas entradas

| # | Fecha | Herramienta | Prompt (resumen) | Resultado generado | ¿Se utilizó? | Validación realizada | Modificaciones | Responsable |
|---|---|---|---|---|---|---|---|---|
| 6 | | | | | Sí / Parcialmente / No | | | |
