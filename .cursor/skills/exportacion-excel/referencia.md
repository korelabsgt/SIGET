# Referencia exportación Excel

## safeFilename

Patrón compartido (copiar o importar si se centraliza después):

```typescript
function safeFilename(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "export"
  );
}
```

Nombre final típico: `` `${prefijo}-${safeFilename(titulo)}-${fecha}.xlsx` `` con `fecha = new Date().toISOString().slice(0, 10)`.

## SheetJS (xlsx)

### Una hoja

```typescript
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function buildDatosRows(items: Item[]): unknown[][] {
  return [
    ["Título del reporte"],
    ["Generado", new Date().toLocaleString("es-GT")],
    [],
    ["Columna A", "Columna B"],
    ...items.map((i) => [i.a, i.b]),
  ];
}

function downloadRows(rows: unknown[][], filename: string) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Datos");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
  );
}

export function downloadModuloExcel(items: Item[]) {
  downloadRows(buildDatosRows(items), `modulo-${safeFilename("nombre")}.xlsx`);
}
```

### Varias hojas

Copiar de `reportes-excel.ts`:

- `ExcelSheetDef = { name: string; rows: unknown[][] }`
- `sanitizeSheetName(base, used)` evita duplicados y caracteres inválidos
- `downloadWorkbook(sheets, filename)` omite hojas vacías

Secciones dentro de una hoja: fila título en mayúsculas + fila vacía entre bloques (`section()` en reportes).

## ExcelJS (estilos)

### Carga dinámica

```typescript
import type ExcelJSType from "exceljs";
import { saveAs } from "file-saver";

type ExcelJSModule = typeof ExcelJSType;

async function cargarExcelJS(): Promise<ExcelJSModule> {
  const mod = await import("exceljs");
  const candidato = (mod as { default?: unknown }).default ?? mod;
  const conWorkbook = candidato as { Workbook?: unknown };
  if (typeof conWorkbook.Workbook === "function") {
    return candidato as ExcelJSModule;
  }
  return mod as unknown as ExcelJSModule;
}
```

### Colores y bordes

ARGB de 8 dígitos (`FF` + hex):

```typescript
const COLOR_HEADER_BG = "FF1A95D3";
const COLOR_HEADER_TXT = "FFFFFFFF";
const COLOR_ZEBRA = "FFEFF7FC";
const COLOR_BORDE = "FFB9DEF1";

function bordeFino() {
  return {
    top: { style: "thin" as const, color: { argb: COLOR_BORDE } },
    left: { style: "thin" as const, color: { argb: COLOR_BORDE } },
    bottom: { style: "thin" as const, color: { argb: COLOR_BORDE } },
    right: { style: "thin" as const, color: { argb: COLOR_BORDE } },
  };
}
```

Celda con fondo:

```typescript
c.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: COLOR_HEADER_BG },
};
```

### Encabezado de hoja de datos

Patrón `asistencia-excel.ts`:

1. Título merge fila 1
2. Subtítulo actividad / contexto fila 2–3
3. Fila vacía
4. Header tabla con freeze: `ws.views = [{ state: "frozen", ySplit: filaHeader }]`
5. Filas zebra (`idx % 2 === 1`)
6. `ws.autoFilter` sobre rango de datos
7. `ws.getColumn(i).width = …`

### Logo

```typescript
async function cargarLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/trifinio/logo-vertical.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        resolve(typeof result === "string" ? result.split(",")[1] : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const imgId = wb.addImage({ base64: logoBase64, extension: "png" });
ws.addImage(imgId, { tl: { col: 1.6, row: 0.25 }, ext: { width: 76, height: 91 } });
```

### Entry point multi-hoja

```typescript
export async function downloadModuloExcel(items: Item[], titulo: string) {
  const ExcelJS = await cargarExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = "SIGET · Plan Trifinio";
  wb.created = new Date();

  hojaResumen(wb, wb.addWorksheet("Resumen"), items, titulo, await cargarLogoBase64());
  hojaDatos(wb.addWorksheet("Todos"), items, titulo);

  const buf = await wb.xlsx.writeBuffer();
  const fecha = new Date().toISOString().slice(0, 10);
  saveAs(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `modulo-${safeFilename(titulo)}-${fecha}.xlsx`,
  );
}
```

## Formato de fechas en celdas

```typescript
function formatFechaExcel(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-GT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatFechaSoloDia(valor: string | null): string {
  const texto = valor?.trim();
  if (!texto) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto);
  if (iso) {
    const [, anio, mes, dia] = iso;
    return `${dia}/${mes}/${anio}`;
  }
  return texto;
}
```

Campos opcionales: `value?.trim() ? value : ""`.

## Integración UI (TablaRegistros)

```typescript
import { downloadAsistenciaExcel } from "./lib/asistencia-excel";
import { toast } from "react-toastify";

const handleExport = async () => {
  if (registros.length === 0) {
    toast.warn("No hay registros para exportar.");
    return;
  }
  try {
    await downloadAsistenciaExcel(registros, nombreActividad);
    toast.success("Excel descargado.");
  } catch (err) {
    console.error("Error al generar Excel:", err);
    toast.error("No se pudo generar el Excel.");
  }
};
```

## Cuándo usar cada enfoque

**xlsx** — export rápido de datos cruzados, pivots simples, muchas hojas homogéneas, sin marca visual.

**exceljs** — entregables institucionales (Plan Trifinio), resumen con KPIs, logo, colores corporativos, hojas segmentadas (por género, institución, etc.).

Si el requerimiento pide “como el Excel de asistencia”, copiar estructura de `asistencia-excel.ts` y adaptar columnas/helpers, no empezar desde xlsx.
