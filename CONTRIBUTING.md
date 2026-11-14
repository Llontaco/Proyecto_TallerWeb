# Cómo trabajamos en SIGSU

## Ramas

| Rama | Propósito | Quién la actualiza |
|---|---|---|
| `main` | Versión en producción; cada merge se despliega automáticamente | Solo mediante pull request desde `develop` (o `hotfix/*`) |
| `develop` | Integración del sprint (ambiente de prueba) | Pull requests desde `feature/*` y `fix/*` |
| `feature/HU-xx-descripcion` | Una historia de usuario o tarea | El integrante responsable |
| `fix/descripcion` | Corrección de un error | El integrante responsable |
| `hotfix/descripcion` | Corrección urgente sobre producción | Se integra a `main` y a `develop` |

## Flujo

1. Crear la rama desde `develop`: `git switch develop && git pull && git switch -c feature/HU-13-notificaciones`.
2. Hacer commits pequeños con mensajes en formato *Conventional Commits*:
   - `feat(solicitudes): agrega filtro por prioridad`
   - `fix(auth): corrige el bloqueo tras intentos fallidos`
   - `test(api): agrega pruebas de notificaciones`
   - `docs: actualiza la guía de despliegue`
   - `ci: agrega análisis CodeQL`
3. Abrir un pull request hacia `develop` y completar la plantilla.
4. El PR se integra solo si **CI está en verde** y **otro integrante lo aprobó** (Definición de Hecho).
5. Al cierre del sprint se abre un PR de `develop` a `main`; al integrarse, CD publica y despliega.
6. Las versiones se marcan con tags: `v0.3.0` (Release Candidate de la Fase III).

## Protección de ramas (configurar en GitHub → Settings → Branches)

- `main` y `develop`: requerir pull request, 1 aprobación y que pasen los checks `Backend`, `Frontend` e `Integración`.
- Bloquear *force push* y borrado.

## Antes de abrir un pull request

```bash
cd backend && mvn verify          # pruebas + cobertura ≥ 60 %
cd frontend && npm test && npm run build
```

Nunca subir `.env`, contraseñas ni tokens. Si se usó IA, registrar el uso en `docs/registro-uso-ia.md`.
