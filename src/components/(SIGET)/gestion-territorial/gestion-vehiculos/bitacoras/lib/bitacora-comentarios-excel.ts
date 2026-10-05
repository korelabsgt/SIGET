import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";

import type { VehiculoRow } from "../../flota/lib/zod";
import { formatFechaHoraGv } from "../../lib/gv-fechas";
import { getDatosReporteComentariosBitacora } from "./actions";
import { nombreSolicitanteBitacora } from "./helpers";
import type { BitacoraComentarioStored, BitacoraRow } from "./zod";

const COLUMN_COUNT = 5;
const LOGO_COL = 1;
const TITLE_START_COL = 2;
const HEADER_ROW = 7;
const DATA_START_ROW = 8;

const TABLE_HEADERS = [
  "FECHA VIAJE",
  "DESTINO",
  "RESPONSABLE",
  "FECHA COMENTARIO",
  "COMENTARIO",
] as const;

const TITLE_ROW_1 = "PLAN TRIFINIO / DIRECCION EJECUTIVA NACIONAL DE GUATEMALA";

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

export type BitacoraComentariosGrupo = {
  mesLabel: string;
  anio: string;
  vehiculo: Pick<VehiculoRow, "placa" | "marca" | "modelo"> | null;
  filas: BitacoraComentarioExportFila[];
};

export type BitacoraComentarioExportFila = {
  fechaViaje: string;
  destino: string;
  responsable: string;
  fechaComentario: string;
  comentario: string;
};

function safeFilename(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "comentarios-bitacora"
  );
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  const base =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\\/?*[\]:]/g, "")
      .trim()
      .slice(0, 31) || "Comentarios";

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

function flattenComentariosBitacora(bitacora: BitacoraRow): BitacoraComentarioExportFila[] {
  const comentarios = bitacora.comentarios ?? [];
  if (comentarios.length === 0) return [];

  const fechaViaje = formatFechaHoraGv(bitacora.fecha);
  const destino = bitacora.destino?.trim() || "—";
  const responsable = nombreSolicitanteBitacora(bitacora);

  return comentarios.map((c: BitacoraComentarioStored) => ({
    fechaViaje,
    destino,
    responsable,
    fechaComentario: formatFechaHoraGv(c.fecha),
    comentario: c.texto.trim(),
  }));
}

function buildGruposComentarios(
  bitacoras: BitacoraRow[],
  vehiculos: VehiculoRow[],
  mesLabel: string,
  anio: string,
  vehiculoId: string,
): BitacoraComentariosGrupo[] {
  const porVehiculo = new Map<string, BitacoraComentarioExportFila[]>();

  for (const bitacora of bitacoras) {
    const filas = flattenComentariosBitacora(bitacora);
    if (filas.length === 0) continue;
    const id = bitacora.vehiculo_id?.trim();
    if (!id) continue;
    const actuales = porVehiculo.get(id) ?? [];
    porVehiculo.set(id, [...actuales, ...filas]);
  }

  const ids = [...porVehiculo.keys()].sort((a, b) => {
    const placaA =
      vehiculos.find((v) => v.id === a)?.placa ??
      bitacoras.find((row) => row.vehiculo_id === a)?.ot_vehiculos?.placa ??
      a;
    const placaB =
      vehiculos.find((v) => v.id === b)?.placa ??
      bitacoras.find((row) => row.vehiculo_id === b)?.ot_vehiculos?.placa ??
      b;
    return placaA.localeCompare(placaB, "es");
  });

  if (vehiculoId !== "all") {
    const filas = porVehiculo.get(vehiculoId) ?? [];
    if (filas.length === 0) return [];
    const vehiculo =
      vehiculos.find((v) => v.id === vehiculoId) ??
      (() => {
        const row = bitacoras.find((b) => b.vehiculo_id === vehiculoId);
        if (!row?.ot_vehiculos) return null;
        return {
          placa: row.ot_vehiculos.placa,
          marca: row.ot_vehiculos.marca,
          modelo: row.ot_vehiculos.modelo,
        };
      })();
    return [{ mesLabel, anio, vehiculo, filas }];
  }

  return ids
    .map((id) => {
      const filas = porVehiculo.get(id) ?? [];
      if (filas.length === 0) return null;
      const vehiculo =
        vehiculos.find((v) => v.id === id) ??
        (() => {
          const row = bitacoras.find((b) => b.vehiculo_id === id);
          if (!row?.ot_vehiculos) return null;
          return {
            placa: row.ot_vehiculos.placa,
            marca: row.ot_vehiculos.marca,
            modelo: row.ot_vehiculos.modelo,
          };
        })();
      return { mesLabel, anio, vehiculo, filas };
    })
    .filter((g): g is BitacoraComentariosGrupo => g !== null);
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
  if (options?.font) cell.font = options.font;
  if (options?.alignment) cell.alignment = options.alignment;
}

function buildComentariosSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  grupo: BitacoraComentariosGrupo,
  logoBuffer: ArrayBuffer | null,
) {
  const titleEndCol = TITLE_START_COL + COLUMN_COUNT - 1;
  const placa = grupo.vehiculo?.placa?.trim().toUpperCase() ?? "SIN PLACA";
  const descripcion = grupo.vehiculo
    ? `${grupo.vehiculo.marca} ${grupo.vehiculo.modelo}`.trim()
    : "Vehículo";

  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  sheet.columns = [
    { width: 18 },
    { width: 28 },
    { width: 22 },
    { width: 18 },
    { width: 48 },
  ];

  sheet.mergeCells(1, LOGO_COL, 3, LOGO_COL);
  sheet.getCell(1, LOGO_COL).alignment = { vertical: "middle", horizontal: "center" };

  if (logoBuffer) {
    const imageId = workbook.addImage({ buffer: logoBuffer, extension: "png" });
    sheet.addImage(imageId, {
      tl: { col: 0.15, row: 0.1 },
      ext: { width: 88, height: 72 },
    });
  }

  setMergedValue(sheet, 1, TITLE_START_COL, titleEndCol, TITLE_ROW_1, {
    font: { bold: true, size: 11 },
    alignment: { horizontal: "center", vertical: "middle" },
  });
  setMergedValue(sheet, 2, TITLE_START_COL, titleEndCol, "COMENTARIOS DE BITÁCORA DE VEHÍCULO", {
    font: { bold: true, size: 12 },
    alignment: { horizontal: "center", vertical: "middle" },
  });
  setMergedValue(
    sheet,
    3,
    TITLE_START_COL,
    titleEndCol,
    `${placa} · ${descripcion.toUpperCase()}`,
    {
      font: { bold: true, size: 10 },
      alignment: { horizontal: "center", vertical: "middle" },
    },
  );
  setMergedValue(
    sheet,
    4,
    TITLE_START_COL,
    titleEndCol,
    `PERÍODO: ${grupo.mesLabel.toUpperCase()} ${grupo.anio}`,
    { alignment: { horizontal: "center" } },
  );

  TABLE_HEADERS.forEach((header, index) => {
    const cell = sheet.getCell(HEADER_ROW, index + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10 };
    cell.fill = headerFill;
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  grupo.filas.forEach((fila, index) => {
    const row = DATA_START_ROW + index;
    sheet.getCell(row, 1).value = fila.fechaViaje;
    sheet.getCell(row, 2).value = fila.destino;
    sheet.getCell(row, 3).value = fila.responsable;
    sheet.getCell(row, 4).value = fila.fechaComentario;
    sheet.getCell(row, 5).value = fila.comentario;
    sheet.getRow(row).alignment = { vertical: "top", wrapText: true };
  });

  const lastRow = Math.max(DATA_START_ROW + grupo.filas.length - 1, HEADER_ROW);
  applyBorderRange(sheet, HEADER_ROW, lastRow, 1, COLUMN_COUNT);
}

export async function downloadComentariosBitacoraExcel(
  grupos: BitacoraComentariosGrupo[],
  filenameBase: string,
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIGET";
  workbook.created = new Date();

  const logoBuffer = await fetchLogoBuffer();
  const usedSheetNames = new Set<string>();

  grupos.forEach((grupo, index) => {
    const sheetName = sanitizeSheetName(
      grupo.vehiculo?.placa ?? `Comentarios-${index + 1}`,
      usedSheetNames,
    );
    buildComentariosSheet(workbook, sheetName, grupo, logoBuffer);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const filename = filenameBase.endsWith(".xlsx") ? filenameBase : `${filenameBase}.xlsx`;
  saveAs(blob, safeFilename(filename.replace(/\.xlsx$/, "")) + ".xlsx");
}

function buildComentariosFilename(
  placa: string | null | undefined,
  mes: string,
  anio: string,
  consolidado: boolean,
): string {
  if (consolidado) {
    return `Comentarios_Bitacora_General_${mes}_${anio}.xlsx`;
  }
  return `Comentarios_Bitacora_${safeFilename(placa ?? "vehiculo")}_${mes}_${anio}.xlsx`;
}

export type ExportComentariosBitacoraResult =
  | { ok: true }
  | { ok: false; reason: "no_data" | "error" };

export async function exportComentariosBitacoraExcel(input: {
  vehiculos: VehiculoRow[];
  vehiculoId: string;
  mes?: number;
  anio?: number;
}): Promise<ExportComentariosBitacoraResult> {
  const now = new Date();
  const mesNum = input.mes ?? now.getMonth() + 1;
  const anioNum = input.anio ?? now.getFullYear();
  const mesStr = String(mesNum);
  const anioStr = String(anioNum);

  try {
    const bitacoras = await getDatosReporteComentariosBitacora(
      mesNum,
      anioNum,
      input.vehiculoId,
    );

    const mesLabel =
      MESES_LABEL[mesNum] ?? format(new Date(anioNum, mesNum - 1, 1), "MMMM");

    const grupos = buildGruposComentarios(
      bitacoras,
      input.vehiculos,
      mesLabel,
      anioStr,
      input.vehiculoId,
    );

    if (grupos.length === 0) {
      return { ok: false, reason: "no_data" };
    }

    const consolidado = input.vehiculoId === "all";
    const vehiculo = consolidado
      ? null
      : (input.vehiculos.find((v) => v.id === input.vehiculoId) ?? null);

    const filename = buildComentariosFilename(
      vehiculo?.placa ?? grupos[0]?.vehiculo?.placa,
      mesStr,
      anioStr,
      consolidado,
    );

    await downloadComentariosBitacoraExcel(grupos, filename);
    return { ok: true };
  } catch (error) {
    console.error("exportComentariosBitacoraExcel:", error);
    return { ok: false, reason: "error" };
  }
}
