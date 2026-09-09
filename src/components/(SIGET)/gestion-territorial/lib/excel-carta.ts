import type ExcelJS from "exceljs";
import * as XLSX from "xlsx";

export const EXCEL_CARTA_MARGINS = {
  left: 0.3,
  right: 0.3,
  top: 0.4,
  bottom: 0.4,
  header: 0.2,
  footer: 0.2,
} as const;

export type OrientacionCarta = "portrait" | "landscape";

export function columnaExcel(col: number): string {
  let n = col;
  let label = "";
  while (n > 0) {
    const resto = (n - 1) % 26;
    label = String.fromCharCode(65 + resto) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

export function ultimaFilaExcelJS(sheet: ExcelJS.Worksheet): number {
  return sheet.lastRow?.number ?? sheet.rowCount ?? 1;
}

export function aplicarPaginaCarta(
  sheet: ExcelJS.Worksheet,
  options: {
    columnCount: number;
    lastRow: number;
    orientation?: OrientacionCarta;
  },
) {
  const { columnCount, lastRow, orientation = "landscape" } = options;
  const filaFinal = Math.max(1, lastRow);
  const colFinal = Math.max(1, columnCount);

  sheet.pageSetup = {
    paperSize: 5,
    orientation,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    verticalCentered: false,
    margins: { ...EXCEL_CARTA_MARGINS },
    printArea: `A1:${columnaExcel(colFinal)}${filaFinal}`,
  };
}

export function aplicarPaginaCartaSheetJS(
  sheet: XLSX.WorkSheet,
  options?: {
    orientation?: OrientacionCarta;
    lastCol?: number;
    lastRow?: number;
  },
) {
  const ref = sheet["!ref"];
  if (!ref) return;

  const range = XLSX.utils.decode_range(ref);
  const lastRow = options?.lastRow ?? range.e.r + 1;
  const lastCol = options?.lastCol ?? range.e.c + 1;
  const orientation = options?.orientation ?? "landscape";

  sheet["!margins"] = { ...EXCEL_CARTA_MARGINS };
  sheet["!pageSetup"] = {
    paperSize: 1,
    orientation,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    verticalCentered: false,
  };
  sheet["!print"] = {
    area: `A1:${columnaExcel(lastCol)}${lastRow}`,
  };
}
