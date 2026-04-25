# @coongro/consultations

## 0.7.1

### Patch Changes

- a153132: Fix: medications were silently dropped when editing a consultation. The update mutation now mirrors the services delete-then-recreate pattern, and `ConsultationUpdateData` includes the `medications` field.

## 0.7.0

### Minor Changes

- 750ee8c: Migrate to strict `@coongro/datetime` API and refactor `follow_up_date` schema.

  **Schema** (migration `0005_strict_datetime_and_followup`):
  - All timestamps switched to `timestamp with time zone` and Drizzle `mode: 'date'`.
  - `follow_up_date` (previously `text` with custom format `YYYY-MM-DD HH:mm-HH:mm`) split into three typed columns: `follow_up_date` (`date`), `follow_up_start_time` (`time`), `follow_up_end_time` (`time`). Postgres now validates structure; no more ad-hoc parsing per consumer.

  **Code**:
  - `Consultation` entity uses branded `UTCTimestamp` / `DateKey`; mapper at repo boundary applies `toUTCTimestamp()` so JSON responses are ISO-Z.
  - Deleted `utils/follow-up.ts` (`parseFollowUpDate`) and `useConsultationCalendarSync`/`ConsultationForm` read the three columns directly.
  - `formatConsultationDate*` in `utils/labels.ts` require `tz` now (no browser-TZ fallback).
  - Repositories normalize string inputs to `Date` at the boundary; `nowUTC()` updates switched to `dbNow()`.

  Pre-launch change: no data migration. DB needs to drop + recreate `follow_up_date` column.

## 0.6.2

### Patch Changes

- b9dfc68: fix: remove `@coongro/appointments` from `dependencies` to break the circular package dependency. The runtime coupling (follow-up creates appointment) already uses the SDK action bus with a silent fallback, so the static dependency was unnecessary.

## 0.6.1

### Patch Changes

- fd20414: fix: staff_id migration, follow-up appointments, default vet setting

## 0.6.0

### Minor Changes

- 928484e: Use calendar DatePicker/DateTimePicker instead of native inputs, fix duplicate toast on edit

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
