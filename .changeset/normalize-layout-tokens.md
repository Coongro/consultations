---
"@coongro/consultations": minor
---

Normalize layout tokens and redesign services/list views

- Extract shared price/category utilities and reusable PriceInput/ServiceFormDialog components
- Lift data fetching to parent views for better component reusability
- Redesign consultations list with consolidated columns, PageHeader, and improved empty states
- Redesign services view with server-side category filtering and pagination
- Add onViewAll prop to ConsultationTimeline for navigation
- New public exports: PriceInput, ServiceFormDialog, formatCurrency, formatPrice, sanitizePrice, isValidPrice, createCategoryMap
