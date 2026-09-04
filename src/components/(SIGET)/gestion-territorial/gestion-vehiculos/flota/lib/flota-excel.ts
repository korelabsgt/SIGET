import type ExcelJSType from "exceljs";
import { saveAs } from "file-saver";
import { createClient } from "@/utils/supabase/client";

import {
  normalizeVehiculoStoragePath,
  VEHICULOS_SIGNED_URL_TTL_SEC,
  VEHICULOS_STORAGE_BUCKET,
} from "../../lib/storage";
import {
  formatEstadoVehiculoLabel,
  fotosVehiculo,
  getMantenimientoAlertStatus,
} from "./helpers";
import type { VehiculoRow } from "./zod";

type ExcelJSModule = typeof ExcelJSType;

const COLOR_AZUL = "FF1A95D3";
const COLOR_AZUL_OSCURO = "FF0F5F87";
const COLOR_HEADER_BG = "FF1A95D3";
const COLOR_HEADER_TXT = "FFFFFFFF";
const COLOR_ZEBRA = "FFEFF7FC";
const COLOR_BORDE = "FFB9DEF1";

const FOTO_ANCHO_PX = 200;
const FOTO_ALTO_PX = 150;
const FOTO_FILA_ALTO_PT = 118;
const FOTO_SEPARACION_PX = 20;
const PX_POR_UNIDAD_COL = 7.5;

const SPAN_COLS = 8;
const CAMPO_COL = 1;
const VALOR_COL = 2;

function safeFilename(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "flota-vehicular"
  );
}

function safeSheetName(placa: string, used: Set<string>): string {
  const base = placa
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/*?:\[\]]/g, "")
    .trim()
    .slice(0, 28) || "Vehiculo";
  let name = base;
  let n = 2;
  while (used.has(name.toLowerCase())) {
    const suffix = `-${n}`;
    name = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    n += 1;
  }
  used.add(name.toLowerCase());
  return name;
}

function formatFechaExport(fecha: string | null | undefined): string {
  if (!fecha) return "Sin registrar";
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return "Sin registrar";
  return parsed.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function cargarExcelJS(): Promise<ExcelJSModule> {
  const mod = await import("exceljs");
  const candidato = (mod as { default?: unknown }).default ?? mod;
  const conWorkbook = candidato as { Workbook?: unknown };
  if (typeof conWorkbook.Workbook === "function") {
    return candidato as ExcelJSModule;
  }
  return mod as unknown as ExcelJSModule;
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

async function blobABase64(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      resolve(typeof result === "string" ? result.split(",")[1] ?? null : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

async function firmarUrlsFotos(paths: string[]): Promise<Record<string, string>> {
  const cleaned = [
    ...new Set(
      paths
        .map((path) => normalizeVehiculoStoragePath(path))
        .filter((path): path is string => Boolean(path)),
    ),
  ];
  if (cleaned.length === 0) return {};

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(VEHICULOS_STORAGE_BUCKET)
    .createSignedUrls(cleaned, VEHICULOS_SIGNED_URL_TTL_SEC);

  if (error) return {};

  const map: Record<string, string> = {};
  for (let i = 0; i < cleaned.length; i += 1) {
    const item = data?.[i];
    if (item?.signedUrl && !item.error) {
      map[cleaned[i]!] = item.signedUrl;
    }
  }
  return map;
}

async function urlABase64Imagen(
  url: string,
): Promise<{ base64: string; extension: "png" | "jpeg" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const base64 = await blobABase64(blob);
    if (!base64) return null;
    const extension: "png" | "jpeg" =
      blob.type.includes("png") || url.toLowerCase().includes(".png") ? "png" : "jpeg";
    return { base64, extension };
  } catch {
    return null;
  }
}

async function cargarFotosBase64(
  vehiculo: VehiculoRow,
): Promise<Array<{ base64: string; extension: "png" | "jpeg" }>> {
  const paths = fotosVehiculo(vehiculo);
  if (paths.length === 0) return [];

  const signedMap = await firmarUrlsFotos(paths);
  const imagenes: Array<{ base64: string; extension: "png" | "jpeg" }> = [];

  for (const path of paths) {
    const key = normalizeVehiculoStoragePath(path);
    const url = key ? signedMap[key] : "";
    if (!url) continue;
    const imagen = await urlABase64Imagen(url);
    if (imagen) imagenes.push(imagen);
  }

  return imagenes;
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
  filaIni = 2,
  filaFin = 4,
  colIni = 1,
  colFin = SPAN_COLS,
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

function pintarSubtitulo(
  ws: ExcelJSType.Worksheet,
  fila: number,
  texto: string,
  colorBg = COLOR_AZUL_OSCURO,
) {
  ws.mergeCells(fila, 1, fila, SPAN_COLS);
  const c = ws.getCell(fila, 1);
  c.value = texto;
  c.font = { bold: true, size: 11, color: { argb: COLOR_HEADER_TXT } };
  c.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: colorBg },
  };
  c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(fila).height = 22;
}

function filasDetalleVehiculo(vehiculo: VehiculoRow): [string, string][] {
  const mantenimiento = getMantenimientoAlertStatus(vehiculo.kilometraje_actual);

  return [
    ["Placa", vehiculo.placa],
    ["Marca", vehiculo.marca],
    ["Modelo", vehiculo.modelo],
    ["Color", vehiculo.color],
    ["Año", vehiculo.anio ? String(vehiculo.anio) : "Sin registrar"],
    ["Kilometraje", `${vehiculo.kilometraje_actual.toLocaleString("es-GT")} km`],
    ["Estado operativo", formatEstadoVehiculoLabel(vehiculo.estado)],
    ["Fecha de vencimiento seguro", formatFechaExport(vehiculo.vencimiento_seguro)],
    ["Fecha de vencimiento circulación", formatFechaExport(vehiculo.vencimiento_circulacion)],
    [
      "Próximo servicio",
      `${mantenimiento.siguienteServicio.toLocaleString("es-GT")} km (${mantenimiento.kmFaltantes.toLocaleString("es-GT")} km restantes)`,
    ],
  ];
}

function pintarKpis(ws: ExcelJSType.Worksheet, fila: number, vehiculo: VehiculoRow) {
  const kpis: [string, string, string, number, number][] = [
    ["Kilometraje", vehiculo.kilometraje_actual.toLocaleString("es-GT"), COLOR_AZUL, 1, 3],
    ["Estado", formatEstadoVehiculoLabel(vehiculo.estado), COLOR_AZUL_OSCURO, 4, 5],
    ["Año", vehiculo.anio ? String(vehiculo.anio) : "—", COLOR_AZUL, 6, SPAN_COLS],
  ];

  kpis.forEach(([label, valor, color, colIni, colFin]) => {
    ws.mergeCells(fila, colIni, fila, colFin);
    const c = ws.getCell(fila, colIni);
    c.value = `${label}\n${valor}`;
    c.font = { bold: true, size: 11, color: { argb: COLOR_HEADER_TXT } };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: color },
    };
    c.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    c.border = bordeFino();
  });

  ws.getRow(fila).height = 42;
}

function pintarEncabezadoTablaDetalle(ws: ExcelJSType.Worksheet, fila: number) {
  const headers = ["Campo", "Valor"];
  headers.forEach((header, index) => {
    const col = index + 1;
    const mergeFin = index === 0 ? 1 : SPAN_COLS;
    if (index === 1) {
      ws.mergeCells(fila, col, fila, mergeFin);
    }
    const c = ws.getCell(fila, col);
    c.value = header;
    c.font = { bold: true, size: 10, color: { argb: COLOR_HEADER_TXT } };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLOR_HEADER_BG },
    };
    c.alignment = { vertical: "middle", horizontal: "center" };
    c.border = bordeFino();
  });
  ws.getRow(fila).height = 24;
}

function pintarFilasDetalle(ws: ExcelJSType.Worksheet, filaInicio: number, vehiculo: VehiculoRow): number {
  let fila = filaInicio;
  const filas = filasDetalleVehiculo(vehiculo);

  filas.forEach(([campo, valor], idx) => {
    const cCampo = ws.getCell(fila, CAMPO_COL);
    cCampo.value = campo;
    cCampo.font = { bold: true, size: 10, color: { argb: "FF374151" } };
    cCampo.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    cCampo.border = bordeFino();

    ws.mergeCells(fila, VALOR_COL, fila, SPAN_COLS);
    const cValor = ws.getCell(fila, VALOR_COL);
    cValor.value = valor;
    cValor.font = { size: 10, color: { argb: "FF1F2937" } };
    cValor.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    cValor.border = bordeFino();

    if (idx % 2 === 1) {
      const fill = {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: COLOR_ZEBRA },
      };
      cCampo.fill = fill;
      cValor.fill = fill;
    }

    ws.getRow(fila).height = 20;
    fila += 1;
  });

  return fila;
}

function aplicarAnchos(ws: ExcelJSType.Worksheet) {
  ws.getColumn(1).width = 24;
  for (let col = 2; col <= SPAN_COLS; col++) {
    ws.getColumn(col).width = 16;
  }
}

function anchoHojaPx(ws: ExcelJSType.Worksheet): number {
  let total = 0;
  for (let col = 1; col <= SPAN_COLS; col += 1) {
    total += (ws.getColumn(col).width ?? 8.43) * PX_POR_UNIDAD_COL;
  }
  return total;
}

function pxAColumna(ws: ExcelJSType.Worksheet, px: number): number {
  let acum = 0;
  for (let col = 1; col <= SPAN_COLS; col += 1) {
    const ancho = (ws.getColumn(col).width ?? 8.43) * PX_POR_UNIDAD_COL;
    if (acum + ancho >= px) {
      return col - 1 + (px - acum) / ancho;
    }
    acum += ancho;
  }
  return SPAN_COLS;
}

function medidasFotosFila(cantidad: number, anchoHoja: number): { ancho: number; alto: number } {
  if (cantidad <= 0) {
    return { ancho: FOTO_ANCHO_PX, alto: FOTO_ALTO_PX };
  }

  const separacionTotal = Math.max(0, cantidad - 1) * FOTO_SEPARACION_PX;
  const anchoMaximo = (anchoHoja - separacionTotal) / cantidad;
  const ancho = Math.min(FOTO_ANCHO_PX, Math.floor(anchoMaximo));
  const alto = Math.round(ancho * (FOTO_ALTO_PX / FOTO_ANCHO_PX));

  return { ancho: Math.max(ancho, 120), alto: Math.max(alto, 90) };
}

function pintarEncabezadoInstitucional(
  wb: ExcelJSType.Workbook,
  ws: ExcelJSType.Worksheet,
  vehiculo: VehiculoRow,
  logoBase64: string | null,
) {
  const headerColIni = 1;
  const headerColFin = SPAN_COLS;
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
      tl: { col: 0.2, row: 1.2 },
      ext: { width: 88, height: 104 },
    });
  }

  ws.mergeCells(2, 2, 2, headerColFin);
  const titulo = ws.getCell(2, 2);
  titulo.value = "Ficha de vehículo";
  titulo.font = { bold: true, size: 18, color: { argb: COLOR_AZUL_OSCURO } };
  titulo.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  ws.mergeCells(3, 2, 3, headerColFin);
  const subtitulo = ws.getCell(3, 2);
  subtitulo.value = `${vehiculo.placa} · ${vehiculo.marca} ${vehiculo.modelo}`;
  subtitulo.font = { bold: true, size: 12, color: { argb: COLOR_AZUL } };
  subtitulo.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  ws.mergeCells(4, 2, 4, headerColFin);
  const meta = ws.getCell(4, 2);
  meta.value = `Generado: ${new Date().toLocaleString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} · Plan Trifinio`;
  meta.font = { size: 10, italic: true, color: { argb: "FF6B7280" } };
  meta.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  ws.getRow(1).height = 8;
  ws.getRow(2).height = 48;
  ws.getRow(3).height = 26;
  ws.getRow(4).height = 22;
}

async function pintarSeccionFotografias(
  wb: ExcelJSType.Workbook,
  ws: ExcelJSType.Worksheet,
  vehiculo: VehiculoRow,
  filaInicio: number,
): Promise<number> {
  pintarSubtitulo(ws, filaInicio, "Fotografías del vehículo");
  let fila = filaInicio + 1;

  const imagenes = await cargarFotosBase64(vehiculo);
  if (imagenes.length === 0) {
    ws.mergeCells(fila, 1, fila, SPAN_COLS);
    const vacio = ws.getCell(fila, 1);
    vacio.value = "Sin fotografías registradas";
    vacio.font = { italic: true, size: 10, color: { argb: "FF9CA3AF" } };
    vacio.alignment = { vertical: "middle", horizontal: "center" };
    ws.getRow(fila).height = 28;
    return fila + 1;
  }

  const cantidad = imagenes.length;
  const anchoHoja = anchoHojaPx(ws);
  const { ancho: fotoAncho, alto: fotoAlto } = medidasFotosFila(cantidad, anchoHoja);
  const bloqueAncho = cantidad * fotoAncho + Math.max(0, cantidad - 1) * FOTO_SEPARACION_PX;
  const offsetPx = Math.max(0, (anchoHoja - bloqueAncho) / 2);
  const filaAltoPt = Math.max(FOTO_FILA_ALTO_PT, Math.round(fotoAlto * 0.78) + 12);

  ws.getRow(fila).height = filaAltoPt;

  for (let i = 0; i < cantidad; i += 1) {
    const leftPx = offsetPx + i * (fotoAncho + FOTO_SEPARACION_PX);
    const colIni = pxAColumna(ws, leftPx);
    const imagen = imagenes[i]!;
    const imgId = wb.addImage({
      base64: imagen.base64,
      extension: imagen.extension,
    });

    ws.addImage(imgId, {
      tl: { col: colIni, row: fila - 1 + 0.1 },
      ext: { width: fotoAncho, height: fotoAlto },
    });
  }

  return fila + 1;
}

async function pintarHojaVehiculo(
  wb: ExcelJSType.Workbook,
  ws: ExcelJSType.Worksheet,
  vehiculo: VehiculoRow,
  logoBase64: string | null,
) {
  aplicarAnchos(ws);
  pintarEncabezadoInstitucional(wb, ws, vehiculo, logoBase64);

  pintarKpis(ws, 6, vehiculo);
  pintarSubtitulo(ws, 8, "Información del vehículo");
  pintarEncabezadoTablaDetalle(ws, 9);
  const filaFinTabla = pintarFilasDetalle(ws, 10, vehiculo);
  await pintarSeccionFotografias(wb, ws, vehiculo, filaFinTabla + 1);

  ws.views = [{ state: "frozen", ySplit: 9 }];
}

async function crearWorkbookVehiculos(
  vehiculos: VehiculoRow[],
): Promise<ExcelJSType.Workbook> {
  const ExcelJS = await cargarExcelJS();
  const logoBase64 = await cargarLogoBase64();
  const wb = new ExcelJS.Workbook();
  wb.creator = "SIGET · Plan Trifinio";
  wb.created = new Date();

  const usedNames = new Set<string>();
  for (const vehiculo of vehiculos) {
    const sheetName = safeSheetName(vehiculo.placa, usedNames);
    const ws = wb.addWorksheet(sheetName);
    await pintarHojaVehiculo(wb, ws, vehiculo, logoBase64);
  }

  return wb;
}

async function descargarWorkbook(wb: ExcelJSType.Workbook, fileLabel: string) {
  const buf = await wb.xlsx.writeBuffer();
  const fecha = new Date().toISOString().slice(0, 10);
  saveAs(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${safeFilename(fileLabel)}-${fecha}.xlsx`,
  );
}

export async function exportVehiculoExcel(
  vehiculo: VehiculoRow,
): Promise<{ ok: true } | { ok: false; reason: "no_data" }> {
  const wb = await crearWorkbookVehiculos([vehiculo]);
  await descargarWorkbook(wb, `vehiculo-${vehiculo.placa}`);
  return { ok: true };
}

export async function exportFlotaExcel(
  vehiculos: VehiculoRow[],
): Promise<{ ok: true } | { ok: false; reason: "no_data" }> {
  if (vehiculos.length === 0) {
    return { ok: false, reason: "no_data" };
  }

  const wb = await crearWorkbookVehiculos(vehiculos);
  await descargarWorkbook(wb, "flota-vehicular");
  return { ok: true };
}
