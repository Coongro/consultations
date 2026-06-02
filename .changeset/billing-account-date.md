---
"@coongro/consultations": patch
---

La cuenta de cobro de una consulta ahora queda fechada según la fecha de la consulta (su fecha de negocio), no según el momento del guardado. Antes, al sincronizar con @coongro/billing, la cuenta usaba la fecha de creación; eso hacía que una consulta con fecha retroactiva apareciera en el día equivocado en los reportes de ingresos. Se pasa la fecha de la consulta a `billing.accounts.openForVisit`.
