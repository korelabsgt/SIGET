import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { aplicarPaginaCarta } from "../../../lib/excel-carta";
import type { SolicitudCombustibleRow } from "../../solicitudes/lib/zod";
import {
  conceptoEgresoCuentaCorrienteCupones,
  fechaEgresoCombustible,
  loteValePorRangoCupones,
  montoTotalEntregaCombustibleConInventario,
} from "../../solicitudes/lib/helpers";
import { formatDenominacion, formatRangoCupones } from "./helpers";
import type { ValeLoteRow } from "./zod";

const COLUMN_COUNT = 7;

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

type MovimientoCuenta = {
  sortAt: number;
  ingresoPrimero: number;
  fecha: Date;
  concepto: string;
  ingreso: number | null;
  egreso: number | null;
  cuponDel: number;
  cuponAl: number;
};

export type ExportCuentaCorrienteResult =
  | { ok: true }
  | { ok: false; reason: "no_data" | "error" };

function formatMontoExcel(value: number): string {
  return `Q ${value.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function celdaMonto(value: number | null): string {
  if (value == null || value <= 0) return "-";
  return formatMontoExcel(value);
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
  },
) {
  if (colStart !== colEnd) {
    sheet.mergeCells(row, colStart, row, colEnd);
  }
  const cell = sheet.getCell(row, colStart);
  cell.value = value;
  if (options?.font) cell.font = options.font;
  if (options?.alignment) cell.alignment = options.alignment;
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

function conceptoIngreso(lote: ValeLoteRow): string {
  const monto = lote.cantidad * lote.denominacion;
  return (
    `Entrega de cupones al inventario (fondo ${lote.fondo}, ${lote.cantidad} cupones de ` +
    `${formatMontoExcel(lote.denominacion)}), total ${formatMontoExcel(monto)}, ` +
    `numeración del ${lote.cupon_del} al ${lote.cupon_al}.`
  );
}

function numeroRequisicionPorAnio(
  row: SolicitudCombustibleRow,
  indicePorAnio: Map<string, number>,
): string {
  const fecha = fechaEgresoCombustible(row) ?? new Date();
  const year = format(fecha, "yyyy");
  const next = (indicePorAnio.get(year) ?? 0) + 1;
  indicePorAnio.set(year, next);
  return `${String(next).padStart(3, "0")}/${year}`;
}

function movimientosPorLote(
  lote: ValeLoteRow,
  vales: ValeLoteRow[],
  solicitudes: SolicitudCombustibleRow[],
): MovimientoCuenta[] {
  const movimientos: MovimientoCuenta[] = [];
  const indiceRequisicionAnio = new Map<string, number>();

  const fechaIngreso = new Date(lote.created_at);
  const montoIngreso = lote.cantidad * lote.denominacion;
  movimientos.push({
    sortAt: fechaIngreso.getTime(),
    ingresoPrimero: 0,
    fecha: fechaIngreso,
    concepto: conceptoIngreso(lote),
    ingreso: montoIngreso,
    egreso: null,
    cuponDel: lote.cupon_del,
    cuponAl: lote.cupon_al,
  });

  const solicitudesOrdenadas = [...solicitudes]
    .filter(
      (s) =>
        s.estado === "APROBADO" &&
        s.cupon_del != null &&
        s.cupon_al != null &&
        fechaEgresoCombustible(s) != null,
    )
    .sort((a, b) => {
      const ta = fechaEgresoCombustible(a)!.getTime();
      const tb = fechaEgresoCombustible(b)!.getTime();
      return ta - tb;
    });

  for (const row of solicitudesOrdenadas) {
    const loteEgreso = loteValePorRangoCupones(row, vales);
    if (!loteEgreso || loteEgreso.id !== lote.id) continue;

    const monto = montoTotalEntregaCombustibleConInventario(row, vales);
    if (monto == null || row.cupon_del == null || row.cupon_al == null) continue;

    const fecha = fechaEgresoCombustible(row)!;
    const numero = numeroRequisicionPorAnio(row, indiceRequisicionAnio);

    movimientos.push({
      sortAt: fecha.getTime(),
      ingresoPrimero: 1,
      fecha,
      concepto: conceptoEgresoCuentaCorrienteCupones(row, numero),
      ingreso: null,
      egreso: monto,
      cuponDel: row.cupon_del,
      cuponAl: row.cupon_al,
    });
  }

  return movimientos.sort((a, b) => {
    if (a.sortAt !== b.sortAt) return a.sortAt - b.sortAt;
    return a.ingresoPrimero - b.ingresoPrimero;
  });
}

function mesClave(fecha: Date): string {
  return format(fecha, "yyyy-MM");
}

function etiquetaMes(fecha: Date): string {
  const raw = format(fecha, "MMMM yyyy", { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function buildCuentaCorrienteSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  lote: ValeLoteRow,
  movimientos: MovimientoCuenta[],
  logoBuffer: ArrayBuffer | null,
) {
  const fondo = lote.fondo;
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  sheet.columns = [
    { width: 12 },
    { width: 52 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 12 },
  ];

  sheet.mergeCells(1, 1, 4, 1);
  sheet.mergeCells(1, 2, 2, 6);
  sheet.mergeCells(3, 2, 4, 6);
  sheet.mergeCells(1, 7, 4, 7);

  if (logoBuffer) {
    const imageId = workbook.addImage({ buffer: logoBuffer, extension: "png" });
    sheet.addImage(imageId, {
      tl: { col: 0.15, row: 0.15 },
      ext: { width: 68, height: 54 },
    });
    sheet.addImage(imageId, {
      tl: { col: 6.15, row: 0.15 },
      ext: { width: 68, height: 54 },
    });
  }

  const tituloOficina = sheet.getCell(1, 2);
  tituloOficina.value = "OFICINA TERRITORIAL";
  tituloOficina.font = { bold: true, size: 14 };
  tituloOficina.alignment = { horizontal: "center", vertical: "middle" };

  const tituloPlan = sheet.getCell(3, 2);
  tituloPlan.value = "Plan Trifinio Guatemala";
  tituloPlan.font = { bold: true, size: 11 };
  tituloPlan.alignment = { horizontal: "center", vertical: "middle" };

  sheet.getRow(1).height = 22;
  sheet.getRow(2).height = 22;
  sheet.getRow(3).height = 20;
  sheet.getRow(4).height = 20;
  applyBorders(sheet, 1, 4, 1, 7, mediumBorder);

  mergeSet(sheet, 5, 1, 7, "CUENTA CORRIENTE CUPONES DE COMBUSTIBLE", {
    font: { bold: true, size: 12 },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  });
  applyBorders(sheet, 5, 5, 1, 7, mediumBorder);
  sheet.getRow(5).height = 26;

  mergeSet(
    sheet,
    6,
    1,
    7,
    `Fondo: ${fondo} · Lote ${formatRangoCupones(lote.cupon_del, lote.cupon_al)} · ${formatDenominacion(lote.denominacion)}`,
    {
      font: { bold: true, size: 10 },
      alignment: { horizontal: "center", vertical: "middle", wrapText: true },
    },
  );
  applyBorders(sheet, 6, 6, 1, 7, thinBorder);
  sheet.getRow(6).height = 22;

  const headerRow = 7;
  const headers = [
    "Fecha",
    "Concepto",
    "Ingreso",
    "Egreso",
    "Saldo",
    "Del No.",
    "Al No.",
  ];
  headers.forEach((label, index) => {
    const cell = sheet.getCell(headerRow, index + 1);
    cell.value = label;
    cell.font = { bold: true, size: 10 };
    cell.alignment = {
      horizontal: index === 1 ? "left" : "center",
      vertical: "middle",
      wrapText: true,
    };
  });
  applyBorders(sheet, headerRow, headerRow, 1, 7, thinBorder);

  let saldo = 0;
  let dataRow = headerRow + 1;
  let mesActual = "";

  for (const mov of movimientos) {
    const claveMes = mesClave(mov.fecha);
    if (claveMes !== mesActual) {
      mesActual = claveMes;
      mergeSet(sheet, dataRow, 1, 7, etiquetaMes(mov.fecha), {
        font: { bold: true, size: 10, color: { argb: "FF2C5F9B" } },
        alignment: { horizontal: "left", vertical: "middle" },
      });
      sheet.getRow(dataRow).height = 20;
      applyBorders(sheet, dataRow, dataRow, 1, 7, thinBorder);
      dataRow += 1;
    }

    const ingreso = mov.ingreso ?? 0;
    const egreso = mov.egreso ?? 0;
    saldo += ingreso - egreso;

    sheet.getCell(dataRow, 1).value = format(mov.fecha, "dd/MM/yyyy", { locale: es });
    sheet.getCell(dataRow, 1).alignment = { horizontal: "center", vertical: "top" };

    sheet.getCell(dataRow, 2).value = mov.concepto;
    sheet.getCell(dataRow, 2).alignment = {
      horizontal: "left",
      vertical: "top",
      wrapText: true,
    };

    sheet.getCell(dataRow, 3).value = celdaMonto(mov.ingreso);
    sheet.getCell(dataRow, 4).value = celdaMonto(mov.egreso);
    sheet.getCell(dataRow, 5).value = formatMontoExcel(saldo);

    for (const col of [3, 4, 5]) {
      sheet.getCell(dataRow, col).alignment = { horizontal: "center", vertical: "top" };
    }

    sheet.getCell(dataRow, 6).value = mov.cuponDel;
    sheet.getCell(dataRow, 7).value = mov.cuponAl;
    sheet.getCell(dataRow, 6).alignment = { horizontal: "center", vertical: "top" };
    sheet.getCell(dataRow, 7).alignment = { horizontal: "center", vertical: "top" };

    sheet.getRow(dataRow).height = Math.max(28, Math.ceil(mov.concepto.length / 70) * 14);
    applyBorders(sheet, dataRow, dataRow, 1, 7, thinBorder);
    dataRow += 1;
  }

  if (movimientos.length === 0) {
    mergeSet(sheet, dataRow, 1, 7, "Sin movimientos registrados.", {
      font: { italic: true, size: 10 },
      alignment: { horizontal: "center", vertical: "middle" },
    });
    applyBorders(sheet, dataRow, dataRow, 1, 7, thinBorder);
    dataRow += 1;
  }

  aplicarPaginaCarta(sheet, {
    columnCount: COLUMN_COUNT,
    lastRow: dataRow,
    orientation: "landscape",
  });
}

export async function exportCuentaCorrienteCuponesExcel(
  lote: ValeLoteRow,
  vales: ValeLoteRow[],
  solicitudes: SolicitudCombustibleRow[],
): Promise<ExportCuentaCorrienteResult> {
  const movimientos = movimientosPorLote(lote, vales, solicitudes);

  if (movimientos.length === 0) {
    return { ok: false, reason: "no_data" };
  }

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SIGET";
    workbook.created = new Date();
    const logoBuffer = await fetchLogoBuffer();

    const sheetName = `Lote ${lote.cupon_del}`.slice(0, 31);
    buildCuentaCorrienteSheet(workbook, sheetName, lote, movimientos, logoBuffer);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const fecha = format(new Date(), "yyyy-MM-dd");
    const rango =
      lote.cupon_del === lote.cupon_al
        ? String(lote.cupon_del)
        : `${lote.cupon_del}-${lote.cupon_al}`;
    saveAs(blob, `Cuenta_Corriente_${lote.fondo}_${rango}_${fecha}.xlsx`);
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}
