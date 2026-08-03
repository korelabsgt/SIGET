---
name: componente-fechas-gt
description: Fechas y hora en zona horaria Guatemala — timestamptz vs date en Postgres, helpers en fechas-gt.ts y schemas Zod. Se usa al guardar, leer o mostrar fechas, timestamps, periodos mensuales o campos created_at/updated_at.
---

# Fechas y hora (Guatemala)

Guatemala: **UTC−6 fijo** (sin horario de verano). Util: `@/lib/fechas-gt.ts`.

## Tipos Postgres

| Concepto | Tipo | Ejemplo |
|----------|------|---------|
| Instante con hora | `timestamptz` | `created_at`, `updated_at` |
| Solo día calendario | `date` | `fecha_evento`, `fecha_nacimiento` |
| Solo mes | `timestamptz` | guardar con `mesCalendarioToTimestamptz(mes)` |

Prohibido `timestamp without time zone`.

## SQL mínimo

```sql
created_at timestamptz not null default now(),
updated_at timestamptz,
-- trigger before update → new.updated_at = now()
fecha_evento date not null default current_date
```

## Helpers (`@/lib/fechas-gt.ts`)

| Función | Uso |
|---------|-----|
| `fechaCalendarioGt()` | Hoy en GT como `YYYY-MM-DD` |
| `mesCalendarioGt()` | Mes actual como `YYYY-MM` |
| `normalizarFechaCalendario(value)` | ISO/DB → `YYYY-MM-DD` para `<input type="date">` |
| `formatFechaCalendarioGt(value)` | Mostrar solo fecha |
| `formatFechaHoraGt(value)` | Mostrar fecha + hora en GT |
| `mesCalendarioToTimestamptz(mes)` | Guardar mes en `timestamptz` sin desface |
| `timestamptzToMesCalendario(value)` | Leer mes para `<input type="month">` |

## Guardar

- Columna `date` → string `YYYY-MM-DD` tal cual. No pasar por `new Date()` ni `toISOString()`.
- `timestamptz` con hora real → `default now()` o ISO completo.
- `timestamptz` solo mes → mediodía UTC vía `mesCalendarioToTimestamptz`, no medianoche.
- `updated_at` → trigger Postgres con `now()`.

## Mostrar

- Siempre `timeZone: "America/Guatemala"` vía helpers de `fechas-gt.ts`.
- Prohibido `new Date(iso).getDate()` / `.getHours()` sin zona horaria.
- Prohibido `new Date().toISOString().split("T")[0]` para «hoy».

## Zod

```typescript
export const fechaCalendarioSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const mesCalendarioSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/, "Mes inválido");
```

## Formulario

```tsx
import {
  fechaCalendarioGt,
  formatFechaCalendarioGt,
  formatFechaHoraGt,
  mesCalendarioGt,
  mesCalendarioToTimestamptz,
  normalizarFechaCalendario,
  timestamptzToMesCalendario,
} from "@/lib/fechas-gt";

const [fecha, setFecha] = useState(fechaCalendarioGt);
const [mes, setMes] = useState(mesCalendarioGt);

<input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
<input type="month" value={mes} onChange={(e) => setMes(e.target.value)} />

// al guardar en action:
fecha_evento: normalizarFechaCalendario(fecha),
periodo: mesCalendarioToTimestamptz(mes),
```

Plantillas SQL completas: `nuevo-componente/plantillas.md` sección fechas.
