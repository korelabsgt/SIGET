---
name: ui-graficos
description: Gráficos SIGET con recharts y framer-motion — donas con detalle en el centro, barras agrupadas, anillos de progreso, KPIs y paletas de color. Patrones genéricos para cualquier dato. Se usa al crear o editar gráficos, charts, visualizaciones, donas, barras o dashboards.
---

# Gráficos SIGET

Librerías: **recharts** + **framer-motion** (centro de donas, acordeones). Colores: `@/components/(SIGET)/observatorio/reportes/lib/chart-colors.ts` (`softBarColor`, `chartColor`, `indicadorColor`, etc.).

## Tipos de gráfico

| Tipo | Cuándo | Referencia |
|------|--------|------------|
| **Dona con centro interactivo** | Distribución categórica (2–8 segmentos) | `GraficasAsistencia.tsx`, `InformeMemoriaVista.tsx` |
| **Barras agrupadas** | Comparar series por categoría (ej. rangos × series) | `GraficasAsistencia.tsx` → `BarEdadGeneroPanel` |
| **Anillo de progreso** | Meta vs logrado (un solo ratio) | `InformeMemoriaVista.tsx` → `AvanceProgreso` |
| **Dona + tooltip flotante** | Legacy home público; preferir patrón canónico en código nuevo | `ObservatorioHomeSections.tsx` |
| **Dona/barras en reportes** | Export PDF/pantalla observatorio | `ReportCrossSections.tsx`, `Reportes.tsx` |

## Dona canónica (obligatoria en código nuevo)

Segmento: `{ name: string; value: number; color: string }`. Solo `value > 0`.

### Geometría

- `innerRadius`: 32% del tamaño; `outerRadius`: 48%; `cornerRadius`: 6; `stroke`: none.
- Tamaños: **184px** (panel), **220px** (panel grande / desglose).
- `paddingAngle`: 2 si hay más de un segmento con valor.

### Centro (reposo vs selección)

**Reposo:** número total (`text-3xl font-black`, `es-GT`) + etiqueta «TOTAL» (`text-[10px] uppercase tracking-[0.15em]`).

**Hover o clic en segmento/leyenda:** el bloque total sube (`motion.div layout`); debajo aparece con `AnimatePresence`:
- Nombre del segmento (truncado, `text-[9px]`)
- Línea: **porcentaje** en color del segmento + **cantidad** en `foreground`

**Prohibido:** tooltip flotante de Recharts que tape el total.

### Selección

- Hover en arco: `onMouseEnter` / `onMouseLeave` en `Pie`.
- Clic en fila de leyenda: mismo `activeIndex` (necesario en táctil).
- Clic de nuevo en la misma leyenda: deseleccionar (`null`).

### Animación de llenado

Solo con panel/acordeón abierto (`animateFill={abierto}`):

```typescript
const donutDetailEase = [0.4, 0, 0.2, 1] as const;
const donutFillDurationMs = 1400;
const donutFillBeginMs = 280;
```

Cerrado: placeholder `border-[10px] border-slate-100 dark:border-zinc-800`. Respetar `useReducedMotion`.

### Leyenda

Filas `rounded-full bg-slate-50 dark:bg-zinc-800/60`. Orden: **círculo con valor** → **etiqueta** → **porcentaje** en color del segmento.

Valores grandes: abreviar en círculo (`K` / `M`) con `title` completo en tooltip nativo.

### Layout de panel

```tsx
<div className="rounded-2xl bg-white p-3 sm:p-5 dark:bg-zinc-900/70">
  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{title}</p>
  {/* sm:flex-row: dona izquierda, leyenda derecha */}
</div>
```

**Desglose dual:** grid `lg:grid-cols-[1fr_auto_1fr]` — leyenda grupo A | dona 220px | leyenda grupo B.

### Acordeón (listados)

Pasar `animateFill={accordionOpen}` desde el padre. Ej.: `ProyectosMemoriaList` → `InformeMemoriaVista` → `chartsAnimate`.

## Barras agrupadas

```tsx
<BarChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 4 }} barGap={6} barCategoryGap="22%">
  <CartesianGrid strokeDasharray="3 3" vertical={false} />
  <XAxis dataKey="categoria" tick={{ fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
  <Bar dataKey="serieA" fill={colorA} radius={[8, 8, 0, 0]} maxBarSize={56} />
  <Bar dataKey="serieB" fill={colorB} radius={[8, 8, 0, 0]} maxBarSize={56} />
</BarChart>
```

Leyenda inferior: mismas filas redondeadas que la dona (círculo → etiqueta → %).

Panel: `rounded-3xl border border-slate-200/70 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-card`.

## Anillo de progreso

Un ratio logrado/meta. `startAngle={90}` `endAngle={-270}`. Centro: porcentaje grande. Sin hover de segmentos.

## Colores

No hardcodear paletas por dominio en el skill. Usar:

```typescript
import { softBarColor, chartColor } from "@/components/(SIGET)/observatorio/reportes/lib/chart-colors";

segments.map((s, i) => ({ ...s, color: s.color ?? softBarColor(i) }));
```

Cada segmento puede traer `color` propio; si no, rotar paleta por índice.

## KPI / stat

Tarjeta con icono, label uppercase pequeño, número grande (`AnimatedNumber` opcional en home público).

## Checklist

```
- [ ] Dona nueva usa centro interactivo, no Tooltip flotante
- [ ] Reposo: total + TOTAL centrados en el agujero
- [ ] Hover/clic en segmento o leyenda muestra detalle en el centro
- [ ] Leyenda: valor en círculo → nombre → %
- [ ] animateFill solo con panel/acordeón abierto
- [ ] Colores vía chart-colors o color en el dato
- [ ] Cantidades con toLocaleString("es-GT")
- [ ] useReducedMotion respetado
```

## Referencias

- Dona canónica: `src/components/(SIGET)/asistencia-actividades/GraficasAsistencia.tsx`
- Dona + acordeón listado: `src/components/(SIGET)/memoria-labores/InformeMemoriaVista.tsx`
- Listado con acordeón: `src/components/(SIGET)/memoria-labores/ProyectosMemoriaList.tsx`
- Barras/reportes: `src/components/(SIGET)/observatorio/reportes/ReportCrossSections.tsx`
- Paletas: `src/components/(SIGET)/observatorio/reportes/lib/chart-colors.ts`
