import type ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { aplicarPaginaCarta } from "../../../lib/excel-carta";
import type { FallaRow } from "./zod";
import {
  formatEstadoFallaLabel,
  formatSeveridadLabel,
  formatVehiculoFalla,
} from "./helpers";

const COLUMN_COUNT_CONSOLIDADO = 10;
const COLUMN_COUNT_VEHICULO = 8;
const MIN_DATA_ROWS = 18;
const LOGO_COL = 1;
const TITLE_START_COL = 2;

const TITLE_ROW_1 = "PLAN TRIFINIO/ DIRECCION EJECUTIVA NACIONAL DE GUATEMALA";
const TITLE_ROW_2 = "FORMULARIO DE REPORTE DE AVERIAS Y MANTENIMIENTO VEHICULAR";

const TABLE_HEADERS_VEHICULO = [
  "Fecha",
  "Reportado por",
  "Descripción de la avería",
  "Severidad",
  "Estado",
  "Mecánico / Taller",
  "Diagnóstico",
  "Fecha de reparación",
] as const;

const TABLE_HEADERS_CONSOLIDADO = [
  "FECHA",
  "Placa",
  "Vehículo",
  "Severidad",
  "Estado",
  "Descripción de la Avería",
  "Mecánico / Taller",
  "Diagnostico",
  "Fecha de reparacion",
  "Reportado",
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

function diagnosticoFalla(falla: FallaRow): string {
  return falla.diagnostico?.trim() ?? "";
}

function fechaReparacionFalla(falla: FallaRow): string {
  if (!falla.solventado_at) return "";
  return format(new Date(falla.solventado_at), "dd/MM/yyyy");
}

function filaDatosFalla(falla: FallaRow, porVehiculo: boolean): string[] {
  if (porVehiculo) {
    return [
      format(new Date(falla.created_at), "dd/MM/yyyy"),
      reportadorNombre(falla),
      falla.descripcion,
      formatSeveridadLabel(falla.severidad),
      formatEstadoFallaLabel(falla.estado),
      mecanicoOTaller(falla),
      diagnosticoFalla(falla),
      fechaReparacionFalla(falla),
    ];
  }

  return [
    format(new Date(falla.created_at), "dd/MM/yyyy"),
    falla.vehiculo?.placa ?? "",
    formatVehiculoFalla(falla),
    formatSeveridadLabel(falla.severidad),
    formatEstadoFallaLabel(falla.estado),
    falla.descripcion,
    mecanicoOTaller(falla),
    diagnosticoFalla(falla),
    fechaReparacionFalla(falla),
    reportadorNombre(falla),
  ];
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
  const porVehiculo = grupo.vehiculo !== null;
  const columnCount = porVehiculo ? COLUMN_COUNT_VEHICULO : COLUMN_COUNT_CONSOLIDADO;
  const tableHeaders = porVehiculo ? TABLE_HEADERS_VEHICULO : TABLE_HEADERS_CONSOLIDADO;
  const titleEndCol = TITLE_START_COL + columnCount - 1;

  const sheet = workbook.addWorksheet("Averias", {
    views: [{ showGridLines: true }],
  });

  sheet.columns = porVehiculo
    ? [
        { width: 11 },
        { width: 18 },
        { width: 28 },
        { width: 10 },
        { width: 12 },
        { width: 18 },
        { width: 20 },
        { width: 14 },
      ]
    : [
        { width: 11 },
        { width: 10 },
        { width: 16 },
        { width: 10 },
        { width: 12 },
        { width: 22 },
        { width: 16 },
        { width: 18 },
        { width: 14 },
        { width: 16 },
      ];

  sheet.mergeCells(1, LOGO_COL, 3, LOGO_COL);
  sheet.getCell(1, LOGO_COL).alignment = { vertical: "middle", horizontal: "center" };

  if (logoBuffer) {
    const imageId = workbook.addImage({
      buffer: logoBuffer,
      extension: "png",
    });
    sheet.addImage(imageId, {
      tl: { col: 0.15, row: 0.1 },
      ext: { width: 88, height: 72 },
    });
  }

  setMergedValue(sheet, 1, TITLE_START_COL, titleEndCol, TITLE_ROW_1, {
    font: { bold: true, size: 10 },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  });
  setMergedValue(sheet, 2, TITLE_START_COL, titleEndCol, TITLE_ROW_2, {
    font: { bold: true, size: 10 },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  });
  sheet.mergeCells(3, TITLE_START_COL, 3, titleEndCol);

  sheet.getRow(1).height = 22;
  sheet.getRow(2).height = 22;
  sheet.getRow(3).height = 16;

  const descripcion = formatDescripcionVehiculo(grupo.vehiculo);
  const placa = grupo.vehiculo ? formatPlacaReporte(grupo.vehiculo.placa) : "TODAS";
  const periodo = formatPeriodoReporte(grupo.mesLabel, grupo.anio);
  const metaRow = 4;

  if (porVehiculo) {
    setMergedValue(
      sheet,
      metaRow,
      TITLE_START_COL,
      titleEndCol,
      `${descripcion}     PLACAS: ${placa}     ${periodo}`,
      {
        font: { size: 10, underline: true },
        alignment: { horizontal: "center", vertical: "middle", wrapText: true },
      },
    );
  } else {
    sheet.getCell(metaRow, LOGO_COL).value = "Descripción del Vehículo:";
    sheet.getCell(metaRow, LOGO_COL).font = { bold: true, size: 10 };

    setMergedValue(sheet, metaRow, 3, 4, descripcion, {
      font: { underline: true, size: 10 },
      alignment: { horizontal: "left", vertical: "middle" },
    });

    sheet.getCell(metaRow, 5).value = "PLACAS:";
    sheet.getCell(metaRow, 5).font = { bold: true, size: 10 };

    setCellUnderlineValue(sheet, metaRow, 6, placa, {
      alignment: { horizontal: "left", vertical: "middle" },
    });

    sheet.getCell(metaRow, 7).value = "MES:";
    sheet.getCell(metaRow, 7).font = { bold: true, size: 10 };

    setCellUnderlineValue(sheet, metaRow, 8, periodo, {
      alignment: { horizontal: "left", vertical: "middle" },
    });
  }

  sheet.getRow(metaRow).height = 20;
  sheet.getRow(5).height = 8;

  const headerRowIndex = 6;
  tableHeaders.forEach((header, index) => {
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
  const descripcionColIndex = porVehiculo ? 2 : 5;
  const diagnosticoColIndex = porVehiculo ? 6 : 7;
  const reportadoColIndex = porVehiculo ? 1 : 9;

  for (let offset = 0; offset < Math.max(sorted.length, MIN_DATA_ROWS); offset += 1) {
    const rowIndex = dataStartRow + offset;
    const falla = sorted[offset];

    const values: string[] = falla
      ? filaDatosFalla(falla, porVehiculo)
      : Array.from({ length: columnCount }, () => "");

    values.forEach((value, colIndex) => {
      const cell = sheet.getCell(rowIndex, colIndex + 1);
      cell.value = value;
      cell.font = { size: 10 };
      cell.alignment = {
        horizontal:
          colIndex === descripcionColIndex ||
          colIndex === diagnosticoColIndex ||
          colIndex === reportadoColIndex
            ? "left"
            : "center",
        vertical: "middle",
        wrapText:
          colIndex === descripcionColIndex ||
          colIndex === diagnosticoColIndex ||
          colIndex === reportadoColIndex,
      };
      cell.border = thinBorder;
    });

    sheet.getRow(rowIndex).height = 22;
  }

  applyBorderRange(sheet, headerRowIndex, dataEndRow, 1, columnCount);
  aplicarPaginaCarta(sheet, {
    columnCount,
    lastRow: dataEndRow,
    orientation: "landscape",
  });
}

export type ExportAveriasReporteResult =
  | { ok: true }
  | { ok: false; reason: "no_data" | "error" };

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

export function buildAveriasReporteGrupo(
  fallas: FallaRow[],
  options?: {
    vehiculo?: { placa: string; marca: string; modelo: string } | null;
    mes?: number;
    anio?: number;
  },
): AveriaReporteGrupo {
  const now = new Date();
  const mesNum = options?.mes ?? now.getMonth() + 1;
  const anioNum = options?.anio ?? now.getFullYear();
  return {
    mesLabel: MESES_LABEL[mesNum] ?? String(mesNum),
    anio: String(anioNum),
    vehiculo: options?.vehiculo ?? null,
    fallas,
  };
}

export function buildAveriasReporteFilename(
  placa: string | null | undefined,
  mes: number,
  anio: number,
  consolidado: boolean,
): string {
  const mesLabel = MESES_LABEL[mes] ?? String(mes);
  if (consolidado) {
    return `Reporte_Averias_General_${mesLabel}_${anio}.xlsx`;
  }
  return `Reporte_Averias_${safeFilename(placa ?? "vehiculo")}_${mesLabel}_${anio}.xlsx`;
}

export async function exportAveriasReporteVehiculo(input: {
  fallas: FallaRow[];
  vehiculoId: string;
  vehiculos: Array<{ id?: string | null; placa: string; marca: string; modelo: string }>;
  mes?: number;
  anio?: number;
}): Promise<ExportAveriasReporteResult> {
  const now = new Date();
  const mesNum = input.mes ?? now.getMonth() + 1;
  const anioNum = input.anio ?? now.getFullYear();
  const consolidado = input.vehiculoId === "all";

  const fallas = consolidado
    ? input.fallas
    : input.fallas.filter((falla) => falla.vehiculo_id === input.vehiculoId);

  if (fallas.length === 0) {
    return { ok: false, reason: "no_data" };
  }

  const vehiculo = consolidado
    ? null
    : (input.vehiculos.find((item) => item.id === input.vehiculoId) ??
      (() => {
        const falla = fallas.find((item) => item.vehiculo_id === input.vehiculoId);
        if (!falla?.vehiculo) return null;
        return {
          placa: falla.vehiculo.placa,
          marca: falla.vehiculo.marca,
          modelo: falla.vehiculo.modelo,
        };
      })());

  try {
    const grupo = buildAveriasReporteGrupo(fallas, {
      vehiculo,
      mes: mesNum,
      anio: anioNum,
    });
    const filename = buildAveriasReporteFilename(vehiculo?.placa, mesNum, anioNum, consolidado);
    await downloadAveriasReporteExcel(grupo, filename);
    return { ok: true };
  } catch (error) {
    console.error("exportAveriasReporteVehiculo:", error);
    return { ok: false, reason: "error" };
  }
}

export async function exportAveriasReporte(
  fallas: FallaRow[],
): Promise<ExportAveriasReporteResult> {
  const now = new Date();
  return exportAveriasReporteVehiculo({
    fallas,
    vehiculoId: "all",
    vehiculos: [],
    mes: now.getMonth() + 1,
    anio: now.getFullYear(),
  });
}
