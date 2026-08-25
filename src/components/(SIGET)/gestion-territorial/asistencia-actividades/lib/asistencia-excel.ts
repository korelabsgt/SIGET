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
import type { RegistroAsistenciaRecord } from "./zod";
import { formatoTelefonoVisible } from "./zod";

const COLOR_AZUL = "FF1A95D3";
const COLOR_AZUL_OSCURO = "FF0F5F87";
const COLOR_HEADER_BG = "FF1A95D3";
const COLOR_HEADER_TXT = "FFFFFFFF";
const COLOR_ZEBRA = "FFEFF7FC";
const COLOR_TITULO_TXT = "FF0F5F87";
const COLOR_BORDE = "FFB9DEF1";
const COLOR_HOMBRE = "FF2F80ED";
const COLOR_MUJER = "FFEB5EA6";
const COLOR_BARRA = "FF1A95D3";
const COLOR_BARRA_BG = "FFDCEEF8";

const ENCABEZADOS = [
  "Fecha y hora",
  "DPI",
  "Nombre",
  "Correo electrónico",
  "Teléfono",
  "Institución",
  "Puesto",
  "Género",
  "Fecha de nacimiento",
] as const;

const ANCHOS = [20, 16, 30, 30, 16, 26, 24, 12, 18];

function safeFilename(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "actividad"
  );
}

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

function celdaOpcional(value: string | null): string {
  return value?.trim() ? value : "";
}

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

function filaRegistro(r: RegistroAsistenciaRecord): (string | number)[] {
  return [
    formatFechaExcel(r.created_at),
    r.dpi,
    r.nombre,
    celdaOpcional(r.email),
    r.telefono ? formatoTelefonoVisible(r.telefono) : "",
    celdaOpcional(r.institucion),
    celdaOpcional(r.puesto),
    r.genero === "masculino" ? "Masculino" : "Femenino",
    formatFechaSoloDia(r.fecha_nacimiento),
  ];
}

function bordeFino() {
  return {
    top: { style: "thin" as const, color: { argb: COLOR_BORDE } },
    left: { style: "thin" as const, color: { argb: COLOR_BORDE } },
    bottom: { style: "thin" as const, color: { argb: COLOR_BORDE } },
    right: { style: "thin" as const, color: { argb: COLOR_BORDE } },
  };
}

function bordeEncabezadoResumen(
  fila: number,
  col: number,
  filaIni = 1,
  filaFin = 3,
  colIni = 2,
  colFin = 24,
) {
  const borde = {
    style: "medium" as const,
    color: { argb: COLOR_AZUL },
  };
  return {
    top: fila === filaIni ? borde : undefined,
    bottom: fila === filaFin ? borde : undefined,
    left: col === colIni ? borde : undefined,
    right: col === colFin ? borde : undefined,
  };
}

function aplicarAnchos(ws: ExcelJSType.Worksheet) {
  ANCHOS.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

function pintarTitulo(
  ws: ExcelJSType.Worksheet,
  fila: number,
  texto: string,
  spanCols: number,
  tamano = 16,
) {
  ws.mergeCells(fila, 1, fila, spanCols);
  const c = ws.getCell(fila, 1);
  c.value = texto;
  c.font = { bold: true, size: tamano, color: { argb: COLOR_TITULO_TXT } };
  c.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(fila).height = tamano + 12;
}

function pintarSubtitulo(
  ws: ExcelJSType.Worksheet,
  fila: number,
  texto: string,
  spanCols: number,
  colorBg = COLOR_AZUL_OSCURO,
) {
  ws.mergeCells(fila, 1, fila, spanCols);
  const c = ws.getCell(fila, 1);
  c.value = texto;
  c.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  c.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: colorBg },
  };
  c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(fila).height = 22;
}

function pintarEncabezadoTabla(ws: ExcelJSType.Worksheet, fila: number) {
  ENCABEZADOS.forEach((h, i) => {
    const c = ws.getCell(fila, i + 1);
    c.value = h;
    c.font = { bold: true, size: 10, color: { argb: COLOR_HEADER_TXT } };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLOR_HEADER_BG },
    };
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = bordeFino();
  });
  ws.getRow(fila).height = 26;
}

function pintarFilas(
  ws: ExcelJSType.Worksheet,
  filaInicio: number,
  registros: RegistroAsistenciaRecord[],
): number {
  let fila = filaInicio;
  registros.forEach((r, idx) => {
    const valores = filaRegistro(r);
    valores.forEach((v, i) => {
      const c = ws.getCell(fila, i + 1);
      c.value = v;
      c.font = { size: 10, color: { argb: "FF1F2937" } };
      c.alignment = {
        vertical: "middle",
        horizontal: i === 1 || i === 4 || i === 7 || i === 8 ? "center" : "left",
        wrapText: false,
      };
      c.border = bordeFino();
      if (idx % 2 === 1) {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: COLOR_ZEBRA },
        };
      }
    });
    ws.getRow(fila).height = 18;
    fila += 1;
  });
  return fila;
}

function encabezadoActividad(
  ws: ExcelJSType.Worksheet,
  nombreActividad: string,
  subtitulo: string,
): number {
  pintarTitulo(ws, 1, subtitulo, ENCABEZADOS.length, 16);
  const cAct = ws.getCell(2, 1);
  ws.mergeCells(2, 1, 2, ENCABEZADOS.length);
  cAct.value = `Actividad: ${nombreActividad}`;
  cAct.font = { bold: true, size: 11, color: { argb: "FF374151" } };
  const cFecha = ws.getCell(3, 1);
  ws.mergeCells(3, 1, 3, ENCABEZADOS.length);
  cFecha.value = `Generado: ${new Date().toLocaleString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  cFecha.font = { size: 10, italic: true, color: { argb: "FF6B7280" } };
  return 5;
}

function hojaTodos(
  ws: ExcelJSType.Worksheet,
  registros: RegistroAsistenciaRecord[],
  nombreActividad: string,
) {
  aplicarAnchos(ws);
  ws.views = [{ state: "frozen", ySplit: 6 }];
  const inicio = encabezadoActividad(
    ws,
    nombreActividad,
    "Registros de asistencia",
  );
  pintarEncabezadoTabla(ws, inicio);
  const fin = pintarFilas(ws, inicio + 1, registros);
  ws.autoFilter = {
    from: { row: inicio, column: 1 },
    to: { row: Math.max(inicio, fin - 1), column: ENCABEZADOS.length },
  };
}

function hojaPorGenero(
  ws: ExcelJSType.Worksheet,
  registros: RegistroAsistenciaRecord[],
  nombreActividad: string,
) {
  aplicarAnchos(ws);
  const hombres = registros.filter((r) => r.genero === "masculino");
  const mujeres = registros.filter((r) => r.genero !== "masculino");

  let fila = encabezadoActividad(
    ws,
    nombreActividad,
    "Registros de asistencia por género",
  );

  pintarSubtitulo(ws, fila, `Hombres (${hombres.length})`, ENCABEZADOS.length, COLOR_HOMBRE);
  fila += 1;
  pintarEncabezadoTabla(ws, fila);
  fila += 1;
  if (hombres.length === 0) {
    ws.getCell(fila, 1).value = "Sin registros";
    ws.getCell(fila, 1).font = { italic: true, color: { argb: "FF9CA3AF" } };
    fila += 1;
  } else {
    fila = pintarFilas(ws, fila, hombres);
  }

  fila += 2;

  pintarSubtitulo(ws, fila, `Mujeres (${mujeres.length})`, ENCABEZADOS.length, COLOR_MUJER);
  fila += 1;
  pintarEncabezadoTabla(ws, fila);
  fila += 1;
  if (mujeres.length === 0) {
    ws.getCell(fila, 1).value = "Sin registros";
    ws.getCell(fila, 1).font = { italic: true, color: { argb: "FF9CA3AF" } };
  } else {
    pintarFilas(ws, fila, mujeres);
  }
}

function hojaPorInstitucion(
  ws: ExcelJSType.Worksheet,
  registros: RegistroAsistenciaRecord[],
  nombreActividad: string,
) {
  aplicarAnchos(ws);
  const grupos = new Map<string, RegistroAsistenciaRecord[]>();
  for (const r of registros) {
    const clave = r.institucion?.trim() || "Sin institución";
    const lista = grupos.get(clave);
    if (lista) lista.push(r);
    else grupos.set(clave, [r]);
  }
  const claves = Array.from(grupos.keys()).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" }),
  );

  let fila = encabezadoActividad(
    ws,
    nombreActividad,
    "Registros de asistencia por institución",
  );

  if (claves.length === 0) {
    ws.getCell(fila, 1).value = "Sin registros";
    ws.getCell(fila, 1).font = { italic: true, color: { argb: "FF9CA3AF" } };
    return;
  }

  claves.forEach((clave, i) => {
    if (i > 0) fila += 2;
    const lista = grupos.get(clave) ?? [];
    pintarSubtitulo(ws, fila, `${clave} (${lista.length})`, ENCABEZADOS.length);
    fila += 1;
    pintarEncabezadoTabla(ws, fila);
    fila += 1;
    fila = pintarFilas(ws, fila, lista);
  });
}

function hojaResumen(
  wb: ExcelJSType.Workbook,
  ws: ExcelJSType.Worksheet,
  registros: RegistroAsistenciaRecord[],
  nombreActividad: string,
  logoBase64: string | null,
) {
  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 18;
  ws.getColumn(3).width = 24;
  for (let i = 4; i <= 24; i++) ws.getColumn(i).width = 3.2;

  const headerColIni = 2;
  const headerColFin = 21;
  const headerFilaIni = 2;
  const headerFilaFin = 4;

  for (let fila = headerFilaIni; fila <= headerFilaFin; fila++) {
    for (let col = headerColIni; col <= headerColFin; col++) {
      const c = ws.getCell(fila, col);
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
      c.border = bordeEncabezadoResumen(
        fila,
        col,
        headerFilaIni,
        headerFilaFin,
        headerColIni,
        headerColFin,
      );
    }
  }

  ws.mergeCells(headerFilaIni, headerColIni, headerFilaFin, headerColIni);
  ws.getCell(headerFilaIni, headerColIni).alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  if (logoBase64) {
    const imgId = wb.addImage({ base64: logoBase64, extension: "png" });
    ws.addImage(imgId, {
      tl: { col: 1.15, row: 1.28 },
      ext: { width: 104, height: 124 },
    });
  }

  ws.mergeCells(2, 3, 2, headerColFin);
  const t = ws.getCell(2, 3);
  t.value = "Reporte de asistencia";
  t.font = { bold: true, size: 20, color: { argb: COLOR_AZUL_OSCURO } };
  t.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  ws.mergeCells(3, 3, 3, headerColFin);
  const a = ws.getCell(3, 3);
  a.value = nombreActividad;
  a.font = { bold: true, size: 12, color: { argb: COLOR_AZUL } };
  a.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  ws.mergeCells(4, 3, 4, headerColFin);
  const s = ws.getCell(4, 3);
  s.value = "Plan Trifinio · Agua sin fronteras";
  s.font = { size: 10, italic: true, color: { argb: "FF6B7280" } };
  s.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  ws.getRow(1).height = 10;
  ws.getRow(2).height = 54;
  ws.getRow(3).height = 28;
  ws.getRow(4).height = 26;

  const hombres = registros.filter((r) => r.genero === "masculino").length;
  const mujeres = registros.length - hombres;

  const instituciones = new Map<string, number>();
  for (const r of registros) {
    const clave = r.institucion?.trim() || "Sin institución";
    instituciones.set(clave, (instituciones.get(clave) ?? 0) + 1);
  }
  const instOrdenadas = Array.from(instituciones.entries()).sort(
    (x, y) => y[1] - x[1],
  );

  const kpis: [string, number, string][] = [
    ["Total de asistentes", registros.length, COLOR_AZUL],
    ["Hombres", hombres, COLOR_HOMBRE],
    ["Mujeres", mujeres, COLOR_MUJER],
    ["Instituciones", instituciones.size, COLOR_AZUL_OSCURO],
  ];

  const filaKpiValor = 6;
  const filaKpiLabel = 7;
  ws.getRow(filaKpiValor).height = 30;
  ws.getRow(filaKpiLabel).height = 18;
  kpis.forEach(([label, valor, color], i) => {
    const colInicio = 2 + i * 5;
    const colFin = colInicio + 4;
    ws.mergeCells(filaKpiValor, colInicio, filaKpiValor, colFin);
    ws.mergeCells(filaKpiLabel, colInicio, filaKpiLabel, colFin);
    const cv = ws.getCell(filaKpiValor, colInicio);
    cv.value = valor;
    cv.font = { bold: true, size: 22, color: { argb: "FFFFFFFF" } };
    cv.alignment = { horizontal: "center", vertical: "middle" };
    cv.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: color },
    };
    const cl = ws.getCell(filaKpiLabel, colInicio);
    cl.value = label;
    cl.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
    cl.alignment = { horizontal: "center", vertical: "middle" };
    cl.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: color },
    };
  });

  const maxBarCols = 18;

  const dibujarBarra = (
    fila: number,
    etiqueta: string,
    valor: number,
    total: number,
    color: string,
  ) => {
    const cEtq = ws.getCell(fila, 2);
    cEtq.value = etiqueta;
    cEtq.font = { size: 10, color: { argb: "FF374151" } };
    cEtq.alignment = { horizontal: "left", wrapText: false };
    const cVal = ws.getCell(fila, 3);
    cVal.value = valor;
    cVal.font = { bold: true, size: 10, color: { argb: color } };
    cVal.alignment = { horizontal: "center" };

    const llenas = total > 0 ? Math.round((valor / total) * maxBarCols) : 0;
    for (let k = 0; k < maxBarCols; k++) {
      const c = ws.getCell(fila, 4 + k);
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: k < llenas ? color : COLOR_BARRA_BG },
      };
      c.border = {
        top: { style: "thin", color: { argb: "FFFFFFFF" } },
        bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
      };
    }
    ws.getRow(fila).height = 18;
  };

  let fila = filaKpiLabel + 2;

  ws.mergeCells(fila, 2, fila, 24);
  const g1 = ws.getCell(fila, 2);
  g1.value = "Distribución por género";
  g1.font = { bold: true, size: 12, color: { argb: COLOR_TITULO_TXT } };
  fila += 1;
  dibujarBarra(fila, "Hombres", hombres, registros.length, COLOR_HOMBRE);
  fila += 1;
  dibujarBarra(fila, "Mujeres", mujeres, registros.length, COLOR_MUJER);
  fila += 2;

  ws.mergeCells(fila, 2, fila, 24);
  const g2 = ws.getCell(fila, 2);
  g2.value = "Asistentes por institución";
  g2.font = { bold: true, size: 12, color: { argb: COLOR_TITULO_TXT } };
  fila += 1;

  const maxInst = instOrdenadas.length > 0 ? instOrdenadas[0][1] : 0;
  instOrdenadas.forEach(([nombre, valor]) => {
    dibujarBarra(fila, nombre, valor, maxInst, COLOR_BARRA);
    fila += 1;
  });
}

export function buildAsistenciaExcelRows(
  registros: RegistroAsistenciaRecord[],
  nombreActividad: string,
): unknown[][] {
  const rows: unknown[][] = [
    ["Registros de asistencia"],
    ["Actividad", nombreActividad],
    [],
    [...ENCABEZADOS],
  ];
  for (const r of registros) rows.push(filaRegistro(r));
  return rows;
}

export async function downloadAsistenciaExcel(
  registros: RegistroAsistenciaRecord[],
  nombreActividad: string,
) {
  const ExcelJS = await cargarExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = "SIGET · Plan Trifinio";
  wb.created = new Date();

  const logoBase64 = await cargarLogoBase64();

  hojaResumen(
    wb,
    wb.addWorksheet("Resumen"),
    registros,
    nombreActividad,
    logoBase64,
  );
  hojaTodos(wb.addWorksheet("Todos"), registros, nombreActividad);
  hojaPorGenero(wb.addWorksheet("Por género"), registros, nombreActividad);
  hojaPorInstitucion(
    wb.addWorksheet("Por institución"),
    registros,
    nombreActividad,
  );

  const buf = await wb.xlsx.writeBuffer();
  const fecha = new Date().toISOString().slice(0, 10);
  saveAs(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `asistencia-${safeFilename(nombreActividad)}-${fecha}.xlsx`,
  );
}
