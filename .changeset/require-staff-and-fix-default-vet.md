---
'@coongro/consultations': patch
---

fix: hacer staff_id obligatorio en consulta y corregir aplicación del veterinario predeterminado (COONG-113)

- La validación del veterinario ahora usa el patrón nativo de HTML5 (`required` via input espejo) en lugar de un toast, consistente con "Motivo de consulta *". El campo `vet_name` por texto libre dejó de ser una fallback válida — el staff debe seleccionarse del personal.
- Cuando se preselecciona el veterinario predeterminado desde el setting `consultations.defaultStaffId`, el form ahora también fetchea el staff member y popula `vet_name` con el contact_name. Antes solo seteaba `staff_id`, lo que dejaba `vet_name` vacío al guardar.
