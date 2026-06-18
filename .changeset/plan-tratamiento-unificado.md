---
"@coongro/consultations": minor
---

Plan de tratamiento unificado en el formulario de consulta (P de SOAP): medicamentos, servicios y seguimiento bajo una sola sección "P — Plan de tratamiento", con un toggle de precios visible/oculto. Reusa los editores existentes (MedicationFormList, ServiceLineForm) y el mecanismo de view-contributions (la sección de medicación/vacunas contribuida sigue funcionando), sin cambios en la lógica de guardado. El interleave pixel-exacto de la lista única y el precio por medicamento quedan diferidos (requieren schema).
