---
'@coongro/consultations': minor
---

refactor(ui): adopt FormSection + FormDialogSubmit from `@coongro/ui-components` 0.28.0 (COONG-112)

- Cada sección del SOAP en `ConsultationForm` ahora usa `UI.FormSection` (Card + ícono + título) en vez del helper local `SectionHeader` + `UI.Card`.
- `CreateConsultationButton` ahora usa `UI.FormDialogSubmit`: footer sticky con botones Cancelar/Registrar consulta siempre visibles, sin importar el scroll del form.
- `ConsultationForm` expone props nuevas para integrarse con submit externos: `formRef`, `hideActions`, `onSavingChange`. Compatible hacia atrás (todas opcionales).
