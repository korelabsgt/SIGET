import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { aplicarPaginaCarta } from "../../../lib/excel-carta";
import type { SolicitudCombustibleRow } from "../../solicitudes/lib/zod";
import {
  cantidadCuponesSolicitud,
  formatEntreganteNombre,
  formatSolicitanteNombre,
} from "../../solicitudes/lib/helpers";

const COLUMN_COUNT = 10;

const FILL_ACTIVIDAD: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE5E7EB" },
};

const FILL_HEADER: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF3F4F6" },
};

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const mediumBorder: Partial<ExcelJS.Borders> = {
  top: { style: "medium" },
  left: { style: "medium" },
  bottom: { style: "medium" },
  right: { style: "medium" },
};

function safeFilename(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 72) || "requisicion-combustible"
  );
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  const base =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\\/?*[\]:]/g, "")
      .trim()
      .slice(0, 31) || "Requisicion";

  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) {
    const tail = `-${suffix}`;
    candidate = `${base.slice(0, 31 - tail.length)}${tail}`;
    suffix += 1;
  }
  used.add(candidate);
  return candidate;
}

function sheetNameForRequisicion(row: SolicitudCombustibleRow, index: number): string {
  const placa = row.vehiculo?.placa?.trim().toUpperCase() || "VEH";
  const fecha = row.fecha_aprobacion
    ? format(new Date(row.fecha_aprobacion), "ddMMyy")
    : String(index + 1);
  return `${placa} ${fecha}`;
}

function applyBorders(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  border: Partial<ExcelJS.Borders>,
) {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) {
      sheet.getCell(row, col).border = border;
    }
  }
}

function mergeSet(
  sheet: ExcelJS.Worksheet,
  row: number,
  colStart: number,
  colEnd: number,
  value: string,
  options?: {
    font?: Partial<ExcelJS.Font>;
    alignment?: Partial<ExcelJS.Alignment>;
    fill?: ExcelJS.Fill;
  },
) {
  if (colStart !== colEnd) {
    sheet.mergeCells(row, colStart, row, colEnd);
  }
  const cell = sheet.getCell(row, colStart);
  cell.value = value;
  if (options?.font) cell.font = options.font;
  if (options?.alignment) cell.alignment = options.alignment;
  if (options?.fill) cell.fill = options.fill;
}

function underlineValue(
  sheet: ExcelJS.Worksheet,
  row: number,
  colStart: number,
  colEnd: number,
  value: string,
) {
  mergeSet(sheet, row, colStart, colEnd, value, {
    font: { size: 10, underline: true },
    alignment: { horizontal: "left", vertical: "middle" },
  });
}

async function fetchLogoBuffer(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch("/trifinio/logo.png");
    if (!response.ok) return null;
    return response.arrayBuffer();
  } catch {
    return null;
  }
}

function numeroRequisicion(row: SolicitudCombustibleRow): string {
  const year = row.fecha_aprobacion
    ? format(new Date(row.fecha_aprobacion), "yyyy")
    : format(new Date(), "yyyy");
  const suffix = row.id.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `${suffix} / ${year}`;
}

function fechaLugarEsquipulas(row: SolicitudCombustibleRow): string {
  if (!row.fecha_aprobacion) return "Esquipulas, ___ de _____________ de ________";
  const d = new Date(row.fecha_aprobacion);
  const dia = format(d, "d", { locale: es });
  const mes = format(d, "MMMM", { locale: es });
  const anio = format(d, "yyyy", { locale: es });
  return `Esquipulas, ${dia} de ${mes} de ${anio}`;
}

function buildRequisicionSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  row: SolicitudCombustibleRow,
  logoBuffer: ArrayBuffer | null,
) {
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  sheet.columns = [
    { width: 11 },
    { width: 11 },
    { width: 11 },
    { width: 11 },
    { width: 11 },
    { width: 11 },
    { width: 11 },
    { width: 11 },
    { width: 11 },
    { width: 11 },
  ];

  sheet.mergeCells(1, 1, 4, 2);
  sheet.mergeCells(1, 3, 2, 8);
  sheet.mergeCells(3, 3, 4, 8);
  sheet.mergeCells(1, 9, 4, 10);

  if (logoBuffer) {
    const imageId = workbook.addImage({ buffer: logoBuffer, extension: "png" });
    sheet.addImage(imageId, {
      tl: { col: 0.2, row: 0.15 },
      ext: { width: 72, height: 58 },
    });
    sheet.addImage(imageId, {
      tl: { col: 8.2, row: 0.15 },
      ext: { width: 72, height: 58 },
    });
  }

  const tituloInstitucion = sheet.getCell(1, 3);
  tituloInstitucion.value = "COMISIÓN TRINACIONAL DEL PLAN TRIFINIO";
  tituloInstitucion.font = { bold: true, size: 11 };
  tituloInstitucion.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };

  const tituloOficina = sheet.getCell(3, 3);
  tituloOficina.value = "OFICINA TERRITORIAL";
  tituloOficina.font = { bold: true, size: 11 };
  tituloOficina.alignment = { horizontal: "center", vertical: "middle" };

  sheet.getRow(1).height = 20;
  sheet.getRow(2).height = 20;
  sheet.getRow(3).height = 18;
  sheet.getRow(4).height = 18;

  applyBorders(sheet, 1, 4, 1, 10, mediumBorder);

  mergeSet(sheet, 5, 1, 8, "REQUISICIÓN DE COMBUSTIBLE", {
    font: { bold: true, size: 14 },
    alignment: { horizontal: "center", vertical: "middle" },
  });
  mergeSet(sheet, 5, 9, 10, `No. ${numeroRequisicion(row)}`, {
    font: { bold: true, size: 10 },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  });
  applyBorders(sheet, 5, 5, 1, 10, mediumBorder);
  sheet.getRow(5).height = 28;

  mergeSet(sheet, 6, 1, 10, "Solicito combustible para el siguiente vehículo:", {
    font: { bold: true, size: 10 },
    alignment: { horizontal: "left", vertical: "middle" },
  });
  applyBorders(sheet, 6, 6, 1, 10, thinBorder);

  const placa = row.vehiculo?.placa?.trim().toUpperCase() ?? "";
  const piloto = formatSolicitanteNombre(row);
  const servicio = "Plan Trifinio — Oficina Territorial";
  const actividad = row.comentarios?.trim() ?? "";

  mergeSet(sheet, 7, 1, 3, "No. de Placas:", {
    font: { bold: true, size: 10 },
    alignment: { vertical: "middle" },
  });
  underlineValue(sheet, 7, 4, 10, placa);
  applyBorders(sheet, 7, 7, 1, 10, thinBorder);

  mergeSet(sheet, 8, 1, 3, "Al servicio de:", {
    font: { bold: true, size: 10 },
    alignment: { vertical: "middle" },
  });
  underlineValue(sheet, 8, 4, 10, servicio);
  applyBorders(sheet, 8, 8, 1, 10, thinBorder);

  mergeSet(sheet, 9, 1, 3, "Nombre del Piloto:", {
    font: { bold: true, size: 10 },
    alignment: { vertical: "middle" },
  });
  underlineValue(sheet, 9, 4, 10, piloto);
  applyBorders(sheet, 9, 9, 1, 10, thinBorder);

  mergeSet(sheet, 10, 1, 10, "Actividad (es) a Realizar:", {
    font: { bold: true, size: 10 },
    alignment: { vertical: "middle" },
  });
  applyBorders(sheet, 10, 10, 1, 10, thinBorder);

  sheet.mergeCells(11, 1, 14, 10);
  const actividadCell = sheet.getCell(11, 1);
  actividadCell.value = actividad;
  actividadCell.fill = FILL_ACTIVIDAD;
  actividadCell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
  actividadCell.font = { size: 10 };
  applyBorders(sheet, 11, 14, 1, 10, thinBorder);
  sheet.getRow(11).height = 22;
  sheet.getRow(12).height = 22;
  sheet.getRow(13).height = 22;
  sheet.getRow(14).height = 22;

  mergeSet(sheet, 15, 1, 3, "KILOMETRAJE", {
    font: { bold: true, size: 10 },
    alignment: { horizontal: "center", vertical: "middle" },
    fill: FILL_HEADER,
  });
  mergeSet(sheet, 15, 4, 10, "CUPONES", {
    font: { bold: true, size: 10 },
    alignment: { horizontal: "center", vertical: "middle" },
    fill: FILL_HEADER,
  });
  applyBorders(sheet, 15, 15, 1, 10, thinBorder);

  mergeSet(sheet, 16, 4, 4, "Cantidad", {
    font: { bold: true, size: 9 },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
    fill: FILL_HEADER,
  });
  mergeSet(sheet, 16, 5, 5, "Denominación", {
    font: { bold: true, size: 9 },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
    fill: FILL_HEADER,
  });
  mergeSet(sheet, 16, 6, 7, "Total", {
    font: { bold: true, size: 9 },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
    fill: FILL_HEADER,
  });
  mergeSet(sheet, 16, 8, 8, "Del", {
    font: { bold: true, size: 9 },
    alignment: { horizontal: "center", vertical: "middle" },
    fill: FILL_HEADER,
  });
  mergeSet(sheet, 16, 9, 10, "Al", {
    font: { bold: true, size: 9 },
    alignment: { horizontal: "center", vertical: "middle" },
    fill: FILL_HEADER,
  });

  mergeSet(sheet, 17, 1, 2, "Anterior:", {
    font: { bold: true, size: 10 },
    alignment: { vertical: "middle" },
  });
  mergeSet(sheet, 18, 1, 2, "Actual:", {
    font: { bold: true, size: 10 },
    alignment: { vertical: "middle" },
  });

  const cantidad = cantidadCuponesSolicitud(row);
  const cuponDel = row.cupon_del ?? "";
  const cuponAl = row.cupon_al ?? "";

  sheet.getCell(17, 4).value = cantidad > 0 ? cantidad : "";
  sheet.getCell(17, 5).value = "";
  mergeSet(sheet, 17, 6, 7, "", {
    alignment: { horizontal: "center", vertical: "middle" },
  });
  sheet.getCell(17, 8).value = cuponDel;
  mergeSet(sheet, 17, 9, 10, cuponAl === "" ? "" : String(cuponAl), {
    alignment: { horizontal: "center", vertical: "middle" },
  });

  applyBorders(sheet, 16, 20, 1, 10, thinBorder);

  mergeSet(sheet, 20, 4, 5, "Total:", {
    font: { bold: true, size: 10 },
    alignment: { horizontal: "right", vertical: "middle" },
  });
  mergeSet(sheet, 20, 6, 7, "", {
    font: { bold: true, size: 10 },
    alignment: { horizontal: "center", vertical: "middle" },
  });

  mergeSet(sheet, 21, 1, 10, `Lugar y Fecha: ${fechaLugarEsquipulas(row)}`, {
    font: { size: 10 },
    alignment: { horizontal: "left", vertical: "middle" },
  });
  applyBorders(sheet, 21, 21, 1, 10, thinBorder);

  mergeSet(sheet, 22, 1, 5, "Entregado Por:", {
    font: { bold: true, size: 10 },
    alignment: { vertical: "top" },
  });
  sheet.mergeCells(22, 6, 24, 10);
  applyBorders(sheet, 22, 24, 1, 10, thinBorder);

  const entregante = formatEntreganteNombre(row);
  mergeSet(sheet, 25, 6, 10, entregante, {
    font: { bold: true, size: 10 },
    alignment: { horizontal: "center", vertical: "middle" },
  });
  mergeSet(sheet, 26, 6, 10, "Asistente Financiera OT", {
    font: { size: 9 },
    alignment: { horizontal: "center", vertical: "middle" },
  });

  mergeSet(
    sheet,
    27,
    1,
    7,
    "Recibí conforme los cupones indicados en esta solicitud:",
    {
      font: { size: 10 },
      alignment: { vertical: "middle" },
    },
  );
  sheet.mergeCells(27, 8, 28, 10);
  applyBorders(sheet, 27, 28, 1, 10, thinBorder);

  const lastRow = 28;
  aplicarPaginaCarta(sheet, {
    columnCount: COLUMN_COUNT,
    lastRow,
    orientation: "portrait",
  });
}

export type ExportRequisicionCombustibleResult =
  | { ok: true }
  | { ok: false; reason: "not_approved" | "no_data" | "error" };

async function writeRequisicionesWorkbook(
  rows: SolicitudCombustibleRow[],
  filenameBase: string,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIGET";
  workbook.created = new Date();

  const logoBuffer = await fetchLogoBuffer();
  const usedSheetNames = new Set<string>();

  rows.forEach((row, index) => {
    const sheetName = sanitizeSheetName(sheetNameForRequisicion(row, index), usedSheetNames);
    buildRequisicionSheet(workbook, sheetName, row, logoBuffer);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${safeFilename(filenameBase)}.xlsx`);
}

export async function exportRequisicionCombustibleExcel(
  row: SolicitudCombustibleRow,
): Promise<ExportRequisicionCombustibleResult> {
  if (row.estado !== "APROBADO") {
    return { ok: false, reason: "not_approved" };
  }

  try {
    const placa = row.vehiculo?.placa ?? "vehiculo";
    const fecha = row.fecha_aprobacion
      ? format(new Date(row.fecha_aprobacion), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");

    await writeRequisicionesWorkbook([row], `Requisicion_Combustible_${placa}_${fecha}`);
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function exportRequisicionesCombustibleExcel(
  rows: SolicitudCombustibleRow[],
  options?: { filenameSuffix?: string },
): Promise<ExportRequisicionCombustibleResult> {
  const aprobadas = rows.filter((row) => row.estado === "APROBADO");
  if (aprobadas.length === 0) {
    return { ok: false, reason: "no_data" };
  }

  try {
    const fecha = format(new Date(), "yyyy-MM-dd");
    const suffix = options?.filenameSuffix?.trim();
    const base = suffix
      ? `Requisiciones_Combustible_${suffix}_${fecha}`
      : `Requisiciones_Combustible_${fecha}`;

    await writeRequisicionesWorkbook(aprobadas, base);
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}
