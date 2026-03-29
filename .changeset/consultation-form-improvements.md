---
"@coongro/consultations": minor
---

Improve consultation form with SOAP workflow, vital signs, and structured physical exam

- Add PetPicker to consultation form when no patient is pre-selected
- Add heart rate (FC), respiratory rate (FR), and body condition score (BCS) to vital signs
- Add structured physical exam by body systems (WNL/ABN checklist)
- Reorder form sections to follow clinical SOAP flow
- Auto-fill vital signs from patient's last consultation (configurable)
- Add contextual placeholder examples per body system
- Add `prefillVitals` and `structuredExam` settings
- Export medication constants via `./constants/medication` subpath
- New reusable components: VitalSignCard, PhysicalExamSummary, ExamSystemRow, ExamSystemList
- Responsive ExamSystemList with compact mode for mobile
