import type ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";

import { fechaCalendarioGt } from "@/lib/fechas-gt";
import type { FallaRow } from "./zod";
import {
  formatEstadoFallaLabel,
  formatSeveridadLabel,
  formatVehiculoFalla,
} from "./helpers";

const COLUMN_COUNT = 9;
const MIN_DATA_ROWS = 18;
const LOGO_COL = 2;
const TITLE_START_COL = 3;
const TITLE_END_COL = 8;
const TITLE_ROW_1 = "PLAN TRIFINIO/ DIRECCION EJECUTIVA NACIONAL DE GUATEMALA";
const TITLE_ROW_2 = "FORMULARIO DE REPORTE DE AVERIAS Y MANTENIMIENTO VEHICULAR";

const TABLE_HEADERS = [
  "FECHA",
  "Placa",
  "Vehículo",
  "Severidad",
  "Estado",
  "Descripción de la Avería",
  "Reportado por",
  "Mecánico / Taller",
  "Firma Responsable del Reporte",
] as const;

const MESES_LABEL: Record<number, string> = {
  1: "Enero",
  2: "Febrero",
  3: "Marzo",
  4: "Abril",
  5: "Mayo",
  6: "Junio",
  7: "Julio",
  8: "Agosto",
  9: "Septiembre",
  10: "Octubre",
  11: "Noviembre",
  12: "Diciembre",
};

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const headerFill: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFD9D9D9" },
};

export type AveriaReporteGrupo = {
  mesLabel: string;
  anio: string;
  vehiculo: { placa: string; marca: string; modelo: string } | null;
  fallas: FallaRow[];
};

type ExcelJSImport = typeof import("exceljs");

async function cargarExcelJS(): Promise<ExcelJSImport> {
  const mod = await import("exceljs");
  const candidato = (mod as { default?: unknown }).default ?? mod;
  const conWorkbook = candidato as { Workbook?: unknown };
  if (typeof conWorkbook.Workbook === "function") {
    return candidato as ExcelJSImport;
  }
  return mod as unknown as ExcelJSImport;
}

function safeFilename(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "reporte-averias"
  );
}

function currentPeriodoGt(): { mesLabel: string; anio: string } {
  const fecha = fechaCalendarioGt();
  const [anio, mes] = fecha.split("-");
  const mesNum = Number(mes);
  return {
    mesLabel: MESES_LABEL[mesNum] ?? mes,
    anio,
  };
}

function formatDescripcionVehiculo(
  vehiculo: { marca: string; modelo: string } | null,
): string {
  if (!vehiculo) return "CONSOLIDADO GENERAL";
  const marca = vehiculo.marca.trim().toUpperCase();
  const modelo = vehiculo.modelo.trim().toUpperCase();
  return `${marca} ${modelo}`.trim();
}

function formatPlacaReporte(placa: string): string {
  return placa.trim().toUpperCase().replace(/\s+/g, "-");
}

function formatPeriodoReporte(mesLabel: string, anio: string): string {
  return `${mesLabel.toUpperCase()} ${anio}`;
}

function reportadorNombre(falla: FallaRow): string {
  return falla.reportador?.nombre?.trim() ?? "";
}

function mecanicoOTaller(falla: FallaRow): string {
  const mecanico = falla.mecanico?.nombre?.trim();
  const taller = falla.taller_externo?.trim();
  if (mecanico && taller) return `${mecanico} / ${taller}`;
  return mecanico || taller || "";
}

function setCellUnderlineValue(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: string,
  options?: { font?: Partial<ExcelJS.Font>; alignment?: Partial<ExcelJS.Alignment> },
) {
  const cell = sheet.getCell(row, col);
  cell.value = value;
  cell.font = { size: 10, underline: true, ...options?.font };
  if (options?.alignment) {
    cell.alignment = options.alignment;
  }
}

function applyBorderRange(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
) {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) {
      sheet.getCell(row, col).border = thinBorder;
    }
  }
}

function setMergedValue(
  sheet: ExcelJS.Worksheet,
  row: number,
  startCol: number,
  endCol: number,
  value: string,
  options?: { font?: Partial<ExcelJS.Font>; alignment?: Partial<ExcelJS.Alignment> },
) {
  if (startCol !== endCol) {
    sheet.mergeCells(row, startCol, row, endCol);
  }
  const cell = sheet.getCell(row, startCol);
  cell.value = value;
  if (options?.font) {
    cell.font = options.font;
  }
  if (options?.alignment) {
    cell.alignment = options.alignment;
  }
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

function buildAveriaSheet(
  workbook: ExcelJS.Workbook,
  grupo: AveriaReporteGrupo,
  logoBuffer: ArrayBuffer | null,
) {
  const sheet = workbook.addWorksheet("Averias", {
    views: [{ showGridLines: true }],
  });

  sheet.columns = [
    { width: 12 },
    { width: 12 },
    { width: 22 },
    { width: 12 },
    { width: 14 },
    { width: 28 },
    { width: 22 },
    { width: 22 },
    { width: 28 },
  ];

  sheet.mergeCells(1, LOGO_COL, 3, LOGO_COL);
  sheet.getCell(1, LOGO_COL).alignment = { vertical: "middle", horizontal: "center" };

  if (logoBuffer) {
    const imageId = workbook.addImage({
      buffer: logoBuffer,
      extension: "png",
    });
    sheet.addImage(imageId, {
      tl: { col: 1.12, row: 0.12 },
      ext: { width: 84, height: 68 },
    });
  }

  setMergedValue(sheet, 1, TITLE_START_COL, TITLE_END_COL, TITLE_ROW_1, {
    font: { bold: true, size: 11 },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  });
  setMergedValue(sheet, 2, TITLE_START_COL, TITLE_END_COL, TITLE_ROW_2, {
    font: { bold: true, size: 11 },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  });

  sheet.getRow(1).height = 22;
  sheet.getRow(2).height = 22;
  sheet.getRow(3).height = 18;

  const descripcion = formatDescripcionVehiculo(grupo.vehiculo);
  const placa = grupo.vehiculo ? formatPlacaReporte(grupo.vehiculo.placa) : "TODAS";
  const periodo = formatPeriodoReporte(grupo.mesLabel, grupo.anio);

  sheet.getCell(4, LOGO_COL).value = "Descripción del Vehículo:";
  sheet.getCell(4, LOGO_COL).font = { bold: true, size: 10 };

  setMergedValue(sheet, 4, 3, 4, descripcion, {
    font: { underline: true, size: 10 },
    alignment: { horizontal: "left", vertical: "middle" },
  });

  sheet.getCell(4, 5).value = "PLACAS:";
  sheet.getCell(4, 5).font = { bold: true, size: 10 };

  setCellUnderlineValue(sheet, 4, 6, placa, {
    alignment: { horizontal: "left", vertical: "middle" },
  });

  sheet.getCell(4, 7).value = "MES:";
  sheet.getCell(4, 7).font = { bold: true, size: 10 };

  setCellUnderlineValue(sheet, 4, 8, periodo, {
    alignment: { horizontal: "left", vertical: "middle" },
  });

  sheet.getRow(4).height = 20;
  sheet.getRow(5).height = 8;

  const headerRowIndex = 6;
  TABLE_HEADERS.forEach((header, index) => {
    const cell = sheet.getCell(headerRowIndex, index + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10 };
    cell.fill = headerFill;
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = thinBorder;
  });
  sheet.getRow(headerRowIndex).height = 36;

  const sorted = [...grupo.fallas].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const dataStartRow = headerRowIndex + 1;
  const dataEndRow = dataStartRow + Math.max(sorted.length, MIN_DATA_ROWS) - 1;

  for (let offset = 0; offset < Math.max(sorted.length, MIN_DATA_ROWS); offset += 1) {
    const rowIndex = dataStartRow + offset;
    const falla = sorted[offset];

    const values: string[] = falla
      ? (() => {
          const reportador = reportadorNombre(falla);
          return [
            format(new Date(falla.created_at), "dd/MM/yyyy"),
            falla.vehiculo?.placa ?? "",
            formatVehiculoFalla(falla),
            formatSeveridadLabel(falla.severidad),
            formatEstadoFallaLabel(falla.estado),
            falla.descripcion,
            reportador,
            mecanicoOTaller(falla),
            reportador,
          ];
        })()
      : ["", "", "", "", "", "", "", "", ""];

    values.forEach((value, colIndex) => {
      const cell = sheet.getCell(rowIndex, colIndex + 1);
      cell.value = value;
      cell.font = { size: 10 };
      cell.alignment = {
        horizontal: colIndex === 8 ? "center" : colIndex <= 2 || colIndex === 5 ? "left" : "center",
        vertical: "middle",
        wrapText: colIndex === 5,
      };
      cell.border = thinBorder;
    });

    sheet.getRow(rowIndex).height = 22;
  }

  applyBorderRange(sheet, headerRowIndex, dataEndRow, 1, COLUMN_COUNT);
}

export function buildAveriasReporteGrupo(fallas: FallaRow[]): AveriaReporteGrupo {
  const { mesLabel, anio } = currentPeriodoGt();
  return {
    mesLabel,
    anio,
    vehiculo: null,
    fallas,
  };
}

export async function downloadAveriasReporteExcel(
  grupo: AveriaReporteGrupo,
  filenameBase: string,
) {
  const ExcelJS = await cargarExcelJS();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIGET · Plan Trifinio";
  workbook.created = new Date();

  const logoBuffer = await fetchLogoBuffer();
  buildAveriaSheet(workbook, grupo, logoBuffer);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const filename = filenameBase.endsWith(".xlsx") ? filenameBase : `${filenameBase}.xlsx`;
  saveAs(blob, safeFilename(filename.replace(/\.xlsx$/i, "")) + ".xlsx");
}

export function buildAveriasReporteFilename(fecha = fechaCalendarioGt()): string {
  return `Reporte_Averias_${fecha}.xlsx`;
}

export type ExportAveriasReporteResult =
  | { ok: true }
  | { ok: false; reason: "no_data" | "error" };

export async function exportAveriasReporte(
  fallas: FallaRow[],
): Promise<ExportAveriasReporteResult> {
  if (fallas.length === 0) {
    return { ok: false, reason: "no_data" };
  }

  try {
    const grupo = buildAveriasReporteGrupo(fallas);
    await downloadAveriasReporteExcel(grupo, buildAveriasReporteFilename());
    return { ok: true };
  } catch (error) {
    console.error("exportAveriasReporte:", error);
    return { ok: false, reason: "error" };
  }
}
