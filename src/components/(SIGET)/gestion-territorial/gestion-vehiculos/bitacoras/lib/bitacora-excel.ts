import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";

import type { VehiculoRow } from "../../flota/lib/zod";
import { getDatosReporteBitacora } from "./actions";
import type { BitacoraRow } from "./zod";

const COLUMN_COUNT = 9;
const MIN_DATA_ROWS = 18;
const TITLE_ROW_1 = "PLAN TRIFINIO/ DIRECCION EJECUTIVA NACIONAL DE GUATEMALA";
const TITLE_ROW_2 = "FORMULARIO DE CONTROL DE USO DE VEHICULO - BITACORA";

const TABLE_HEADERS = [
  "FECHA",
  "Destino de la Misión",
  "Responsable de la Misión",
  "Kilometraje Inicial",
  "Kilometraje Final",
  "Recorrido",
  "Vale",
  "Monto Q.",
  "Firma Responsable de la Misión",
] as const;

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

export type BitacoraReporteGrupo = {
  mesLabel: string;
  anio: string;
  vehiculo: Pick<VehiculoRow, "placa" | "marca" | "modelo" | "color"> | null;
  bitacoras: BitacoraRow[];
};

function safeFilename(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "bitacora"
  );
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  const base =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\\/?*[\]:]/g, "")
      .trim()
      .slice(0, 31) || "Bitacora";

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

function formatDescripcionVehiculo(
  vehiculo: Pick<VehiculoRow, "marca" | "modelo" | "color"> | null,
): string {
  if (!vehiculo) return "CONSOLIDADO GENERAL";
  const marca = vehiculo.marca.trim().toUpperCase();
  const color = vehiculo.color?.trim().toUpperCase() ?? "";
  return color ? `${marca} ${color}` : `${marca} ${vehiculo.modelo.trim().toUpperCase()}`.trim();
}

function formatPlacaReporte(placa: string): string {
  return placa.trim().toUpperCase().replace(/\s+/g, "-");
}

function formatPeriodoReporte(mesLabel: string, anio: string): string {
  return `${mesLabel.toUpperCase()} ${anio}`;
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

function buildBitacoraSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  grupo: BitacoraReporteGrupo,
  logoBuffer: ArrayBuffer | null,
) {
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  sheet.columns = [
    { width: 11 },
    { width: 28 },
    { width: 24 },
    { width: 14 },
    { width: 14 },
    { width: 11 },
    { width: 10 },
    { width: 12 },
    { width: 26 },
  ];

  sheet.mergeCells(1, 1, 3, 1);
  sheet.getCell(1, 1).alignment = { vertical: "middle", horizontal: "center" };

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

  setMergedValue(sheet, 1, 2, COLUMN_COUNT, TITLE_ROW_1, {
    font: { bold: true, size: 11 },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  });
  setMergedValue(sheet, 2, 2, COLUMN_COUNT, TITLE_ROW_2, {
    font: { bold: true, size: 11 },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  });

  sheet.getRow(1).height = 22;
  sheet.getRow(2).height = 22;
  sheet.getRow(3).height = 18;

  const descripcion = formatDescripcionVehiculo(grupo.vehiculo);
  const placa = grupo.vehiculo ? formatPlacaReporte(grupo.vehiculo.placa) : "—";
  const periodo = formatPeriodoReporte(grupo.mesLabel, grupo.anio);

  sheet.getCell(4, 1).value = "Descripción del Vehículo:";
  sheet.getCell(4, 1).font = { bold: true, size: 10 };

  setMergedValue(sheet, 4, 2, 3, descripcion, {
    font: { underline: true, size: 10 },
    alignment: { horizontal: "left", vertical: "middle" },
  });

  sheet.getCell(4, 4).value = "PLACA:";
  sheet.getCell(4, 4).font = { bold: true, size: 10 };

  setMergedValue(sheet, 4, 5, 6, placa, {
    font: { underline: true, size: 10 },
    alignment: { horizontal: "left", vertical: "middle" },
  });

  sheet.getCell(4, 7).value = "MES:";
  sheet.getCell(4, 7).font = { bold: true, size: 10 };

  setMergedValue(sheet, 4, 8, COLUMN_COUNT, periodo, {
    font: { underline: true, size: 10 },
    alignment: { horizontal: "left", vertical: "middle" },
  });

  sheet.getRow(4).height = 20;
  sheet.getRow(5).height = 8;

  const headerRowIndex = 6;
  TABLE_HEADERS.forEach((header, index) => {
    const cell = sheet.getCell(headerRowIndex, index + 1);
    cell.value = header;
    cell.font = {
      bold: true,
      size: index === 5 ? 9 : 10,
      italic: index === 5,
    };
    cell.fill = headerFill;
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = thinBorder;
  });
  sheet.getRow(headerRowIndex).height = 36;

  const sorted = [...grupo.bitacoras].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
  );

  const dataStartRow = headerRowIndex + 1;
  const dataEndRow = dataStartRow + Math.max(sorted.length, MIN_DATA_ROWS) - 1;

  for (let offset = 0; offset < Math.max(sorted.length, MIN_DATA_ROWS); offset += 1) {
    const rowIndex = dataStartRow + offset;
    const bitacora = sorted[offset];

    const values: (string | number | null)[] = bitacora
      ? [
          format(new Date(bitacora.fecha), "dd/MM/yyyy"),
          bitacora.destino,
          bitacora.profiles?.nombre ?? "",
          bitacora.km_inicial,
          bitacora.km_final,
          bitacora.km_recorrido,
          bitacora.vale_combustible ?? "",
          Number(bitacora.monto_combustible) || 0,
          "",
        ]
      : ["", "", "", "", "", "", "", "", ""];

    values.forEach((value, colIndex) => {
      const cell = sheet.getCell(rowIndex, colIndex + 1);
      cell.value = value;
      cell.font = { size: 10 };
      cell.alignment = {
        horizontal: colIndex === 8 ? "center" : colIndex <= 2 ? "left" : "center",
        vertical: "middle",
        wrapText: colIndex <= 2,
      };
      cell.border = thinBorder;

      if (colIndex === 7 && typeof value === "number") {
        cell.numFmt = '"Q"#,##0.00';
      }
      if ((colIndex === 3 || colIndex === 4 || colIndex === 5) && typeof value === "number") {
        cell.numFmt = "#,##0";
      }
    });

    sheet.getRow(rowIndex).height = 22;
  }

  applyBorderRange(sheet, headerRowIndex, dataEndRow, 1, COLUMN_COUNT);
}

export function buildBitacoraReporteGrupos(
  bitacoras: BitacoraRow[],
  vehiculos: VehiculoRow[],
  mesLabel: string,
  anio: string,
  vehiculoId: string,
): BitacoraReporteGrupo[] {
  if (vehiculoId !== "all") {
    const vehiculo = vehiculos.find((item) => item.id === vehiculoId) ?? null;
    return [{ mesLabel, anio, vehiculo, bitacoras }];
  }

  const ids = [...new Set(bitacoras.map((item) => item.vehiculo_id))];
  return ids.map((id) => {
    const vehiculo =
      vehiculos.find((item) => item.id === id) ??
      (() => {
        const row = bitacoras.find((item) => item.vehiculo_id === id);
        if (!row?.ter_vehiculos) return null;
        return {
          placa: row.ter_vehiculos.placa,
          marca: row.ter_vehiculos.marca,
          modelo: row.ter_vehiculos.modelo,
          color: "",
        };
      })();

    return {
      mesLabel,
      anio,
      vehiculo,
      bitacoras: bitacoras.filter((item) => item.vehiculo_id === id),
    };
  });
}

export async function downloadBitacoraReporteExcel(
  grupos: BitacoraReporteGrupo[],
  filenameBase: string,
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIGET";
  workbook.created = new Date();

  const logoBuffer = await fetchLogoBuffer();
  const usedSheetNames = new Set<string>();

  grupos.forEach((grupo, index) => {
    const sheetName = sanitizeSheetName(
      grupo.vehiculo?.placa ?? `Bitacora-${index + 1}`,
      usedSheetNames,
    );
    buildBitacoraSheet(workbook, sheetName, grupo, logoBuffer);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const filename = filenameBase.endsWith(".xlsx") ? filenameBase : `${filenameBase}.xlsx`;
  saveAs(blob, safeFilename(filename.replace(/\.xlsx$/, "")) + ".xlsx");
}

export function buildBitacoraReporteFilename(
  placa: string | null | undefined,
  mes: string,
  anio: string,
  consolidado: boolean,
): string {
  if (consolidado) {
    return `Bitacora_General_${mes}_${anio}.xlsx`;
  }
  return `Bitacora_${safeFilename(placa ?? "vehiculo")}_${mes}_${anio}.xlsx`;
}

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

export type ExportBitacoraReporteResult =
  | { ok: true }
  | { ok: false; reason: "no_data" | "error" };

export async function exportBitacoraReporteVehiculo(input: {
  vehiculos: VehiculoRow[];
  vehiculoId: string;
  mes?: number;
  anio?: number;
}): Promise<ExportBitacoraReporteResult> {
  const now = new Date();
  const mesNum = input.mes ?? now.getMonth() + 1;
  const anioNum = input.anio ?? now.getFullYear();
  const mesStr = String(mesNum);
  const anioStr = String(anioNum);

  try {
    const data = ((await getDatosReporteBitacora(mesNum, anioNum, input.vehiculoId)) ??
      []) as unknown as BitacoraRow[];

    if (data.length === 0) {
      return { ok: false, reason: "no_data" };
    }

    const vehiculo = input.vehiculos.find((item) => item.id === input.vehiculoId) ?? null;
    const grupos = buildBitacoraReporteGrupos(
      data,
      input.vehiculos,
      MESES_LABEL[mesNum] ?? format(new Date(anioNum, mesNum - 1, 1), "MMMM"),
      anioStr,
      input.vehiculoId,
    );
    const nombreArchivo = buildBitacoraReporteFilename(vehiculo?.placa, mesStr, anioStr, false);

    await downloadBitacoraReporteExcel(grupos, nombreArchivo);
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}
