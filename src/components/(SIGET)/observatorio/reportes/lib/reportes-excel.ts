import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { ReportRow } from "./actions";
import {
  aggregateReportByNacPerfil,
  buildReportCampoDimensionCross,
  getAvailableCampos,
  getCampoTotalsForIndicador,
  getIndicadoresEnUso,
  getPoliticasEnDatos,
  indicadorOmiteNacPerfil,
  nacPerfilMatrixFromRows,
  OMITE_NAC_PERFIL_SECTION_TITLE,
  reportRowOmiteNacPerfil,
  rowsOmiteNacPerfil,
} from "./helpers";

export type ExcelSheetDef = { name: string; rows: unknown[][] };

function sanitizeSheetName(base: string, used: Set<string>): string {
  let name = base.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31);
  if (!name) name = "Hoja";
  let finalName = name;
  let i = 2;
  while (used.has(finalName)) {
    const suffix = ` ${i}`;
    finalName = name.slice(0, 31 - suffix.length) + suffix;
    i++;
  }
  used.add(finalName);
  return finalName;
}

export function safeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "reporte";
}

export function downloadWorkbook(sheets: ExcelSheetDef[], filename: string) {
  const wb = XLSX.utils.book_new();
  const used = new Set<string>();
  for (const sheet of sheets) {
    if (sheet.rows.length === 0) continue;
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(sheet.name, used));
  }
  if (used.size === 0) return;
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
  );
}

export function downloadSingleSheet(rows: unknown[][], filename: string, sheetName = "Datos") {
  downloadWorkbook([{ name: sheetName, rows }], filename);
}

function buildPoliticaIndicadorRefs(rows: ReportRow[]) {
  const politicas = getPoliticasEnDatos(rows);
  const indicadores = getIndicadoresEnUso(rows);

  const polRefMap = new Map<string, string>();
  const polRefTable: unknown[][] = [["Ref.", "Código", "Descripción"]];
  politicas.forEach((p, i) => {
    const ref = `Pol. ${i + 1}`;
    polRefMap.set(p.id, ref);
    polRefTable.push([ref, p.codigo, p.descripcion]);
  });

  const indRefMap = new Map<string, string>();
  const indRefTable: unknown[][] = [["Ref.", "Política", "Indicador"]];
  indicadores.forEach((ind, i) => {
    const ref = `Ind. ${i + 1}`;
    indRefMap.set(ind.id, ref);
    const sample = rows.find((r) => r.indicadorId === ind.id);
    indRefTable.push([ref, sample?.politicaCodigo ?? "", ind.nombre]);
  });

  return { polRefMap, indRefMap, polRefTable, indRefTable };
}

export function buildRawDataRows(rows: ReportRow[]): unknown[][] {
  const { polRefMap, indRefMap, polRefTable, indRefTable } = buildPoliticaIndicadorRefs(rows);

  const headers = [
    "Sector",
    "Organización",
    "Ref. política",
    "Ref. indicador",
    "Campo",
    "Nacionalidad",
    "Perfil",
    "Cantidad",
    "Mes",
    "Año",
  ];

  const data = rows.map((r) => [
    r.sectorNombre,
    r.organizacionNombre,
    polRefMap.get(r.politicaId) ?? r.politicaCodigo,
    indRefMap.get(r.indicadorId) ?? "?",
    r.campoNombre,
    r.nacionalidadNombre ?? "Sin especificar",
    r.perfilNombre ?? "Sin especificar",
    r.cantidad,
    r.mes,
    r.anio,
  ]);

  return [
    ["REFERENCIA DE POLÍTICAS"],
    ...polRefTable,
    [],
    ["REFERENCIA DE INDICADORES"],
    ...indRefTable,
    [],
    ["DATOS DETALLADOS"],
    headers,
    ...data,
  ];
}

export function buildOrgSummaryRows(rows: ReportRow[]): unknown[][] {
  const map = new Map<
    string,
    { sectorNombre: string; orgNombre: string; total: number; campos: Map<string, number> }
  >();
  const campoNamesOrdered: string[] = [];
  const campoNameSet = new Set<string>();

  for (const r of rows) {
    const key = r.organizacionId;
    const existing = map.get(key);
    if (existing) {
      existing.total += r.cantidad;
      existing.campos.set(r.campoNombre, (existing.campos.get(r.campoNombre) || 0) + r.cantidad);
    } else {
      const campos = new Map<string, number>();
      campos.set(r.campoNombre, r.cantidad);
      map.set(key, {
        sectorNombre: r.sectorNombre,
        orgNombre: r.organizacionNombre,
        total: r.cantidad,
        campos,
      });
    }
    if (!campoNameSet.has(r.campoNombre)) {
      campoNameSet.add(r.campoNombre);
      campoNamesOrdered.push(r.campoNombre);
    }
  }

  const summaryRows = Array.from(map.values()).sort((a, b) => b.total - a.total);
  const headers = ["Sector", "Organización", ...campoNamesOrdered, "Total"];
  const data = summaryRows.map((row) => [
    row.sectorNombre,
    row.orgNombre,
    ...campoNamesOrdered.map((cn) => row.campos.get(cn) || 0),
    row.total,
  ]);
  const totals = [
    "Total General",
    "",
    ...campoNamesOrdered.map((cn) => summaryRows.reduce((s, r) => s + (r.campos.get(cn) || 0), 0)),
    summaryRows.reduce((s, r) => s + r.total, 0),
  ];
  return [headers, ...data, totals];
}

type CrossExportInput = {
  campos: { catalogId: string; nombre: string }[];
  colIds: string[];
  grid: Map<string, Map<string, number>>;
  getColLabel: (id: string) => string;
};

export function buildCampoDimensionCrossRows(
  cross: CrossExportInput,
  shortColLabels = false
): unknown[][] {
  const colHeaders = shortColLabels
    ? cross.colIds.map((_, i) => `Ind. ${i + 1}`)
    : cross.colIds.map((id) => cross.getColLabel(id));

  const headers = ["Campo", ...colHeaders, "Total"];
  const body = cross.campos.map((campo) => {
    const rowMap = cross.grid.get(campo.catalogId) || new Map();
    let rowSum = 0;
    const vals = cross.colIds.map((colId) => {
      const v = rowMap.get(colId) || 0;
      rowSum += v;
      return v;
    });
    return [campo.nombre, ...vals, rowSum];
  });

  const colTotals = cross.colIds.map((colId) =>
    cross.campos.reduce((s, c) => s + (cross.grid.get(c.catalogId)?.get(colId) || 0), 0)
  );
  const grandTotal = colTotals.reduce((a, b) => a + b, 0);

  return [headers, ...body, ["Total", ...colTotals, grandTotal]];
}

export function buildIndicadorReferenciaRows(
  indicadores: { id: string; nombre: string }[]
): unknown[][] {
  return [
    ["Código", "Indicador"],
    ...indicadores.map((ind, i) => [`Ind. ${i + 1}`, ind.nombre]),
  ];
}

export function buildNacPerfilMatrixRows(rows: ReportRow[]): unknown[][] {
  const { nacIds, perfilIds, totals, nacLabels, perfLabels, crossKey, grandTotal } =
    nacPerfilMatrixFromRows(rows);

  if (nacIds.length === 0 || perfilIds.length === 0) return [["Sin datos"]];

  const headers = [
    "Nacionalidad \\ Perfil",
    ...perfilIds.map((pid) => perfLabels.get(pid) ?? pid),
    "Total fila",
  ];

  const body = nacIds.map((nid) => {
    let rowSum = 0;
    const vals = perfilIds.map((pid) => {
      const v = totals.get(crossKey(nid, pid)) || 0;
      rowSum += v;
      return v;
    });
    return [nacLabels.get(nid) ?? nid, ...vals, rowSum];
  });

  const colTotals = perfilIds.map((pid) =>
    nacIds.reduce((s, nid) => s + (totals.get(crossKey(nid, pid)) || 0), 0)
  );

  return [headers, ...body, ["Total columna", ...colTotals, grandTotal]];
}

export function buildIndicadorCamposSoloRows(indRows: ReportRow[]): unknown[][] {
  const campos = getCampoTotalsForIndicador(indRows);
  if (campos.length === 0) return [["Sin datos"]];

  return [
    ["Campo", "Total"],
    ...campos.map((c) => [c.nombre, c.total]),
    ["Total", campos.reduce((s, c) => s + c.total, 0)],
  ];
}

export function buildIndicadorCrossCamposRows(indRows: ReportRow[]): unknown[][] {
  if (indicadorOmiteNacPerfil(indRows)) {
    return buildIndicadorCamposSoloRows(indRows);
  }

  const crossRows = aggregateReportByNacPerfil(indRows);
  const campos = getCampoTotalsForIndicador(indRows);
  const headers = [
    "Nacionalidad",
    "Perfil",
    ...campos.map((c) => c.nombre),
    "Total",
  ];

  const body = crossRows.map((row) => {
    const nacLabel =
      indRows.find((r) => (r.nacionalidadId || "__none__") === row.nacionalidadId)
        ?.nacionalidadNombre || "Sin especificar";
    const perfLabel =
      indRows.find((r) => (r.perfilId || "__none__") === row.perfilId)?.perfilNombre ||
      "Sin especificar";
    const rowTotal = Object.values(row.valores).reduce((s, v) => s + v, 0);
    return [
      nacLabel,
      perfLabel,
      ...campos.map((c) => row.valores[c.id] ?? 0),
      rowTotal,
    ];
  });

  const totals = [
    "Totales",
    "",
    ...campos.map((c) => c.total),
    campos.reduce((s, c) => s + c.total, 0),
  ];

  return [headers, ...body, totals];
}

export function buildOmiteNacPerfilSectionRows(rows: ReportRow[]): unknown[][] {
  const omitRows = rowsOmiteNacPerfil(rows);
  if (omitRows.length === 0) return [];

  const allCampos = getAvailableCampos(omitRows);
  const crossInd = buildReportCampoDimensionCross(omitRows, allCampos, "indicador");
  const indicadores = crossInd.colIds.map((id) => ({
    id,
    nombre: crossInd.getColLabel(id),
  }));

  const camposSolo = getCampoTotalsForIndicador(omitRows);

  return [
    [OMITE_NAC_PERFIL_SECTION_TITLE.toUpperCase()],
    ["Nota", "Sin desglose por nacionalidad ni perfil"],
    [],
    ["RESUMEN POR CAMPO"],
    ["Campo", "Total"],
    ...camposSolo.map((c) => [c.nombre, c.total]),
    ["Total", camposSolo.reduce((s, c) => s + c.total, 0)],
    [],
    ["CAMPOS × INDICADOR"],
    ...buildCampoDimensionCrossRows(crossInd, true),
    [],
    ["REFERENCIA DE INDICADORES"],
    ...buildIndicadorReferenciaRows(indicadores),
    [],
  ];
}

function section(title: string, rows: unknown[][]): unknown[][] {
  return [[title], ...rows, []];
}

function buildIndicadorHeaderRows(indicadorNombre: string): unknown[][] {
  return [
    ["INDICADOR"],
    ["Nombre", indicadorNombre],
    [],
  ];
}

export function withIndicadorHeader(indicadorNombre: string, rows: unknown[][]): unknown[][] {
  return [...buildIndicadorHeaderRows(indicadorNombre), ...rows];
}

export function downloadIndicadorDetailExcel(indicadorNombre: string, indRows: ReportRow[]) {
  const omite = indicadorOmiteNacPerfil(indRows);
  const rows: unknown[][] = [...buildIndicadorHeaderRows(indicadorNombre)];

  if (omite) {
    rows.push(
      ...section(
        `${OMITE_NAC_PERFIL_SECTION_TITLE.toUpperCase()} — RESUMEN POR CAMPO`,
        buildIndicadorCamposSoloRows(indRows),
      ),
    );
  } else {
    rows.push(
      ...section("MATRIZ NACIONALIDAD × PERFIL", buildNacPerfilMatrixRows(indRows)),
      ...section("RESUMEN CRUZADO POR CAMPOS", buildIndicadorCrossCamposRows(indRows)),
    );
  }

  downloadSingleSheet(
    rows,
    `${safeFilename(indicadorNombre.slice(0, 40))}-detalle-indicador.xlsx`,
    "Detalle indicador"
  );
}

export function downloadCompleteReportExcel(rows: ReportRow[]) {
  const sheets: ExcelSheetDef[] = [];
  const used = new Set<string>();

  const general: unknown[][] = [...buildRawDataRows(rows), []];
  general.push(...section("RESUMEN POR ORGANIZACIÓN", buildOrgSummaryRows(rows)));

  const nacPerfilRows = rows.filter((r) => !reportRowOmiteNacPerfil(r));
  const allCamposNacPerfil = getAvailableCampos(nacPerfilRows);
  if (allCamposNacPerfil.length > 0) {
    const crossNac = buildReportCampoDimensionCross(
      nacPerfilRows,
      allCamposNacPerfil,
      "nacionalidad",
    );
    const crossPerfil = buildReportCampoDimensionCross(
      nacPerfilRows,
      allCamposNacPerfil,
      "perfil",
    );
    general.push(...section("CAMPOS × NACIONALIDAD", buildCampoDimensionCrossRows(crossNac)));
    general.push(...section("CAMPOS × PERFIL", buildCampoDimensionCrossRows(crossPerfil)));
  }

  const omitSection = buildOmiteNacPerfilSectionRows(rows);
  if (omitSection.length > 0) {
    general.push(...omitSection);
  }

  sheets.push({ name: sanitizeSheetName("General", used), rows: general });

  const politicas = getPoliticasEnDatos(rows);
  for (const pol of politicas) {
    const polRows = rows.filter((r) => r.politicaId === pol.id);
    const camposPolitica = getAvailableCampos(polRows);
    const crossInd = buildReportCampoDimensionCross(polRows, camposPolitica, "indicador");
    const indicadores = crossInd.colIds.map((id) => ({
      id,
      nombre: crossInd.getColLabel(id),
    }));

    const polSheet: unknown[][] = [
      ["POLÍTICA DE MIGRACIÓN"],
      ["Código", pol.codigo],
      ["Descripción", pol.descripcion],
      [],
      ...section("CAMPOS × INDICADOR", buildCampoDimensionCrossRows(crossInd, true)),
      ...section("REFERENCIA DE INDICADORES", buildIndicadorReferenciaRows(indicadores)),
    ];
    sheets.push({ name: sanitizeSheetName(pol.codigo, used), rows: polSheet });

    indicadores.forEach((ind, idx) => {
      const indRows = polRows.filter((r) => r.indicadorId === ind.id);
      const omite = indicadorOmiteNacPerfil(indRows);
      const indSheet: unknown[][] = [
        ["DETALLE POR INDICADOR"],
        ["Política", pol.codigo],
        ["Referencia", `Ind. ${idx + 1}`],
        ["Indicador", ind.nombre],
        [],
      ];

      if (omite) {
        indSheet.push(
          ...section(
            `${OMITE_NAC_PERFIL_SECTION_TITLE.toUpperCase()} — RESUMEN POR CAMPO`,
            buildIndicadorCamposSoloRows(indRows),
          ),
        );
      } else {
        indSheet.push(
          ...section("MATRIZ NACIONALIDAD × PERFIL", buildNacPerfilMatrixRows(indRows)),
          ...section("RESUMEN CRUZADO POR CAMPOS", buildIndicadorCrossCamposRows(indRows)),
        );
      }
      sheets.push({
        name: sanitizeSheetName(`${pol.codigo} Ind${idx + 1}`, used),
        rows: indSheet,
      });
    });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadWorkbook(sheets, `reporte-observatorio-${dateStr}.xlsx`);
}

export function downloadCampoIndicadorExcel(
  cross: CrossExportInput,
  indicadores: { id: string; nombre: string }[],
  politicaCodigo: string
) {
  const rows: unknown[][] = [
    ...section("CAMPOS × INDICADOR", buildCampoDimensionCrossRows(cross, true)),
    ...section("REFERENCIA DE INDICADORES", buildIndicadorReferenciaRows(indicadores)),
  ];
  downloadSingleSheet(
    rows,
    `${safeFilename(politicaCodigo)}-campos-indicador.xlsx`,
    "Campos e Indicadores"
  );
}
