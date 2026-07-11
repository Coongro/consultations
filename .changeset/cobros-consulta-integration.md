---
"@coongro/consultations": minor
---

Las consultas ahora registran sus servicios como cobros en el módulo de cuentas (@coongro/billing). Al guardar o editar una consulta, sus líneas de servicio se sincronizan con la cuenta de la visita; re-guardar reemplaza las líneas en vez de duplicarlas, y las vacunas aplicadas en la misma visita no se tocan. Es una dependencia blanda: si billing no está instalado, la consulta se guarda igual.
