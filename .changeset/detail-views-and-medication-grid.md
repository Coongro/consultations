---
'@coongro/consultations': minor
---

refactor(detail-views): unify detail patterns and fix UX issues (COONG-112)

- **`ConsultationDetail`**: action buttons (Editar/Eliminar/extra) ahora honran `action.variant` y `action.icon` con default `default` (brand) y `size: 'sm'`. Botón "Nueva Consulta" desde el detail view de paciente queda amarillo y consistente con el resto.
- **Detail view container**: layout `lg:flex-row` (1024px) bajado a `md:flex-row` (768px) para evitar que el sidebar+main se apile cuando el contenedor interno es chico.
- **`ConsultationDetailView`**: migra delete a `UI.ConfirmDialog` (antes usaba `confirm()` nativo del browser). Edit dialog migrado a `UI.FormDialogSubmit`.
- **`DetailOverrideView`** (override de PetDetail con timeline de consultas): mismo trato — delete con `UI.ConfirmDialog`, edit con `UI.FormDialogSubmit`. Bug fix: el delete antes mostraba un toast sin borrar nada; ahora usa `usePetMutations.softDelete`.
- **`DefaultVetSetting`**: removido el workaround de `useCompactCombobox` ya que el fix vive en core (`@coongro/ui-components` 0.29.0).
- **`MedicationFormList`**: grid de "Dosis + Vía + Duración" ahora usa proporción 2:1:2 (`grid-cols-[2fr_1fr_2fr]` en sm+) y agrega `min-w-0` a los compound fields para que los selects no se pisen entre sí.
- **`consultation` schema**: `updated_at` ahora se actualiza automáticamente en cada update vía `.$onUpdate()` de Drizzle.
