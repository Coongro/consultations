---
"@coongro/consultations": minor
---

Migrate to strict `@coongro/datetime` API and refactor `follow_up_date` schema.

**Schema** (migration `0005_strict_datetime_and_followup`):

- All timestamps switched to `timestamp with time zone` and Drizzle `mode: 'date'`.
- `follow_up_date` (previously `text` with custom format `YYYY-MM-DD HH:mm-HH:mm`) split into three typed columns: `follow_up_date` (`date`), `follow_up_start_time` (`time`), `follow_up_end_time` (`time`). Postgres now validates structure; no more ad-hoc parsing per consumer.

**Code**:

- `Consultation` entity uses branded `UTCTimestamp` / `DateKey`; mapper at repo boundary applies `toUTCTimestamp()` so JSON responses are ISO-Z.
- Deleted `utils/follow-up.ts` (`parseFollowUpDate`) and `useConsultationCalendarSync`/`ConsultationForm` read the three columns directly.
- `formatConsultationDate*` in `utils/labels.ts` require `tz` now (no browser-TZ fallback).
- Repositories normalize string inputs to `Date` at the boundary; `nowUTC()` updates switched to `dbNow()`.

Pre-launch change: no data migration. DB needs to drop + recreate `follow_up_date` column.
