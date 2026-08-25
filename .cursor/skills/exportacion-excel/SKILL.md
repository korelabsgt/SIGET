---
name: exportacion-excel
description: Exportación Excel en SIGET con exceljs o xlsx, file-saver, lib/*-excel.ts y feedback toast. Usar al crear descargas .xlsx, exportar tablas, reportes multi-hoja o Excel con estilos Trifinio.
---

# Exportación Excel

Toda la lógica de Excel vive en `lib/*-excel.ts` dentro del módulo. Prohibido armar el workbook en el componente UI.

Dependencias ya instaladas: `exceljs`, `xlsx`, `file-saver` (+ `@types/file-saver`).

## Elegir librería

| Caso | Librería | Referencia |
|------|----------|------------|
| Tablas simples, matrices `unknown[][]`, varias hojas sin estilo | `xlsx` | `memoria-excel.ts`, `reportes-excel.ts` |
| Estilos, colores, logo, KPIs, freeze, autofilter, barras en celdas | `exceljs` (import dinámico) | `asistencia-excel.ts` |

No mezclar ambas en el mismo archivo salvo migración puntual.

## Estructura del archivo

```
lib/[modulo]-excel.ts
├── tipos/contexto de exportación (si aplica)
├── safeFilename()
├── build*Rows()           → pure, retorna unknown[][]
├── download*Excel()       → entry point async
└── helpers privados       → estilos, hojas, formatos
```

Convenciones:

- Tipos de fila desde `lib/zod.ts` del módulo, nunca `any`.
- Fechas: `es-GT` o helpers de `@/lib/fechas-gt.ts` / skill `componente-fechas-gt`.
- Nombre archivo: slug sin acentos + fecha ISO `YYYY-MM-DD`.
- Workbook con estilo: `wb.creator = "SIGET · Plan Trifinio"`.

## Patrón simple (xlsx)

Ver [`referencia.md`](referencia.md) § SheetJS.

Resumen:

1. `build*Rows()` arma `unknown[][]` (títulos, headers, datos, totales).
2. `XLSX.utils.aoa_to_sheet(rows)` → hoja.
3. `XLSX.write(wb, { bookType: "xlsx", type: "array" })`.
4. `saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename)`.

Multi-hoja: reutilizar `downloadWorkbook(sheets, filename)` de `reportes-excel.ts` o copiar el patrón `sanitizeSheetName` (máx. 31 caracteres, sin `\ / ? * [ ] :`).

## Patrón con estilos (exceljs)

Ver [`referencia.md`](referencia.md) § ExcelJS.

Obligatorio en Next.js:

```typescript
async function cargarExcelJS() {
  const mod = await import("exceljs");
  const candidato = (mod as { default?: unknown }).default ?? mod;
  const conWorkbook = candidato as { Workbook?: unknown };
  if (typeof conWorkbook.Workbook === "function") {
    return candidato as typeof import("exceljs");
  }
  return mod as unknown as typeof import("exceljs");
}
```

Flujo:

1. `const ExcelJS = await cargarExcelJS()`
2. `const wb = new ExcelJS.Workbook()`
3. Una función por hoja (`hojaResumen`, `hojaTodos`, …)
4. `await wb.xlsx.writeBuffer()` → `saveAs`

Colores Trifinio (ARGB sin `#`): celeste `FF1A95D3`, azul oscuro `FF0F5F87`, zebra `FFEFF7FC`, borde `FFB9DEF1`. Logo: `fetch("/trifinio/logo-vertical.png")` → base64 → `wb.addImage`.

## UI (botón exportar)

Skill `ui-toastify`. Patrón del proyecto:

```tsx
const handleExport = async () => {
  if (items.length === 0) {
    toast.warn("No hay registros para exportar.");
    return;
  }
  try {
    await downloadModuloExcel(items, contexto);
    toast.success("Excel descargado.");
  } catch (err) {
    console.error("Error al generar Excel:", err);
    toast.error("No se pudo generar el Excel.");
  }
};
```

Botón opcional reutilizable: `ReportExcelButton` en observatorio (estilo esmeralda). En gestión territorial suele ir inline en toolbar de tabla.

Estados: deshabilitar o advertir si lista vacía; no bloquear UI con spinner salvo export muy pesado.

## Checklist nueva exportación

- [ ] Archivo `lib/*-excel.ts` autocontenido en el módulo
- [ ] `build*Rows` o builders por hoja testeables sin DOM
- [ ] `safeFilename` coherente (NFD, sin acentos, max ~60–80 chars)
- [ ] MIME correcto en Blob
- [ ] Validación datos vacíos antes de generar
- [ ] `toast.success` / `toast.error` en el handler UI
- [ ] Fechas y labels en español Guatemala
- [ ] Nombres de hoja ≤ 31 caracteres y únicos

## Ejemplos en el repo

| Módulo | Archivo | Qué hace |
|--------|---------|----------|
| Asistencia actividades | `asistencia-excel.ts` | ExcelJS: 4 hojas, logo, KPIs, barras, autofilter |
| Observatorio reportes | `reportes-excel.ts` | xlsx: general + hoja por política/indicador |
| Memoria labores | `memoria-excel.ts` | xlsx: informe por proyecto |

UI: `TablaRegistros.tsx` → `downloadAsistenciaExcel`.

## Prohibido

- Generar Excel en `page.tsx` o componentes de lista sin pasar por `lib/*-excel.ts`
- `import ExcelJS from "exceljs"` estático en cliente (usar import dinámico)
- Hardcodear rutas de descarga en server actions (export es cliente con datos ya cargados)
- Omitir `try/catch` y feedback toast en el botón
