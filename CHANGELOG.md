# @coongro/consultations

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
