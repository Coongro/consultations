---
'@coongro/consultations': patch
---

fix: usar logger.info y eliminar tipo ActivationAPI local desincronizado (COONG-158)

El plugin declaraba una interfaz `ActivationAPI` local en `src/entry.ts` cuya forma del logger (`log/warn/error/debug`) no matcheaba la implementación real de `@coongro/core-logging` (`debug/info/warn/error/fatal`). En runtime `logger.log(...)` tiraba `TypeError` y el auto-seed de servicios veterinarios crasheaba en la primera línea, dejando la UI de Servicios vacía sin error visible.

- Eliminada la interfaz local; ahora se importan `ModuleActivationContext` y `ModuleDatabaseAPI` desde `@coongro/plugin-sdk` (el `Logger` se deriva de `ModuleActivationContext['api']['logger']` porque el SDK aún no lo re-exporta directo).
- `logger.log(...)` → `logger.info(...)` en las dos llamadas del seed.
- Check explícito por `api.database` (opcional en `ModuleAPI`).
