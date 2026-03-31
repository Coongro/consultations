# @coongro/consultations

## 0.5.0

### Minor Changes

- 4048f99: Integrate @coongro/calendar for follow-up scheduling and event display

## 0.4.1

### Patch Changes

- d432646: Adopt core Avatar fix: use UI.Avatar with icon prop, replace emoji with DynamicIcon

## 0.4.0

### Minor Changes

- 5135c70: Improve consultation form with SOAP workflow, vital signs, and structured physical exam
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

## 0.3.0

### Minor Changes

- ee61f2c: Structured medication fields and consultation form redesign
  - Replace free-text dosage/frequency/duration with structured columns
  - Add route (via) field for medication administration
  - Shared medication constants exported for cross-plugin use
  - Consultation form: collapsible clinical exam, unified notes, services always visible
  - Auto-prefill weight from patient record
  - Section icons and receipt-style service lines

## 0.2.0

### Minor Changes

- 8bee034: Normalize layout tokens and redesign services/list views
  - Extract shared price/category utilities and reusable PriceInput/ServiceFormDialog components
  - Lift data fetching to parent views for better component reusability
  - Redesign consultations list with consolidated columns, PageHeader, and improved empty states
  - Redesign services view with server-side category filtering and pagination
  - Add onViewAll prop to ConsultationTimeline for navigation
  - New public exports: PriceInput, ServiceFormDialog, formatCurrency, formatPrice, sanitizePrice, isValidPrice, createCategoryMap

## 0.1.9

### Patch Changes

- 886d262: fix(ci): correct release and publish workflows
  - Fix changesets/action version command (use shell script instead of inline &&)
  - Fix scoped registry override in production publish
  - Add tag creation and GitHub Release in publish workflow
  - Remove obsolete tag-release workflow
