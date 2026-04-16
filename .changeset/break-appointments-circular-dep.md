---
'@coongro/consultations': patch
---

fix: remove `@coongro/appointments` from `dependencies` to break the circular package dependency. The runtime coupling (follow-up creates appointment) already uses the SDK action bus with a silent fallback, so the static dependency was unnecessary.
