---
'@coongro/consultations': patch
---

Fix: medications were silently dropped when editing a consultation. The update mutation now mirrors the services delete-then-recreate pattern, and `ConsultationUpdateData` includes the `medications` field.
