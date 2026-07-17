---
'@coongro/consultations': minor
---

feat(settings): campos obligatorios configurables (motivo, diagnóstico)

Nueva sección "Campos obligatorios" en las settings de consulta:

- `consultations.required.reason` (default `true`) — el motivo de consulta era obligatorio hardcodeado; ahora es configurable sin cambiar el comportamiento por defecto.
- `consultations.required.diagnosis` (default `false`) — permite exigir el diagnóstico para guardar.

El formulario valida según estas settings (antes el motivo estaba fijo como obligatorio). Migra la capa de settings de consultations al Builder (`settings.gen.ts`), manteniendo `defaultStaffId` (que setea la sección custom del veterinario).
