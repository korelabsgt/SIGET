import type ExcelJSType from "exceljs";
import { saveAs } from "file-saver";
import { fechaCalendarioGt, formatFechaCalendarioGt } from "@/lib/fechas-gt";
import {
  AMBITO_CUENCA,
  CRITICIDADES,
  GESTION_RECURSOS_HIDRICOS,
  MICROCUENCAS,
  TITULO_MODULO,
} from "./catalogos";
import {
  etiquetaAcuerdo,
  etiquetaCriticidad,
  etiquetaFase,
  formatoQ,
  totalPoblacion,
} from "./helpers";
import type { JaStoreState } from "./zod";

type ExcelJSModule = typeof ExcelJSType;

const COLOR_AZUL = "FF1A95D3";
const COLOR_AZUL_OSCURO = "FF003882";
const COLOR_ORO = "FFC59B27";
const COLOR_HEADER_BG = "FF1A95D3";
const COLOR_HEADER_TXT = "FFFFFFFF";
const COLOR_ZEBRA = "FFEFF7FC";
const COLOR_TITULO_TXT = "FF003882";
const COLOR_BORDE = "FFB9DEF1";
const COLOR_BARRA_BG = "FFDCEEF8";

type HojaDatos = {
  titulo: string;
  subtitulo: string;
  headers: string[];
  filas: (string | number)[][];
  anchos: number[];
};

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

function safeFilename(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "paz-hidrica-ja"
  );
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
  colIni = 2,
  colFin = 21,
) {
  const borde = { style: "medium" as const, color: { argb: COLOR_AZUL } };
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
  spanCols: number,
  colorBg = COLOR_AZUL_OSCURO,
) {
  ws.mergeCells(fila, 1, fila, spanCols);
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

function pintarEncabezadoTabla(
  ws: ExcelJSType.Worksheet,
  fila: number,
  headers: string[],
) {
  headers.forEach((h, i) => {
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

function pintarFilasTabla(
  ws: ExcelJSType.Worksheet,
  filaInicio: number,
  filas: (string | number)[][],
): number {
  let fila = filaInicio;
  filas.forEach((valores, idx) => {
    valores.forEach((v, i) => {
      const c = ws.getCell(fila, i + 1);
      c.value = v;
      c.font = { size: 10, color: { argb: "FF1F2937" } };
      c.alignment = {
        vertical: "middle",
        horizontal: typeof v === "number" ? "center" : "left",
        wrapText: typeof v === "string" && v.length > 40,
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

function encabezadoReporte(
  ws: ExcelJSType.Worksheet,
  titulo: string,
  subtitulo: string,
  spanCols: number,
): number {
  ws.mergeCells(1, 1, 1, spanCols);
  const t = ws.getCell(1, 1);
  t.value = titulo;
  t.font = { bold: true, size: 16, color: { argb: COLOR_TITULO_TXT } };
  t.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(1).height = 28;

  ws.mergeCells(2, 1, 2, spanCols);
  const s = ws.getCell(2, 1);
  s.value = subtitulo;
  s.font = { bold: true, size: 11, color: { argb: COLOR_AZUL } };
  s.alignment = { vertical: "middle", horizontal: "left" };

  ws.mergeCells(3, 1, 3, spanCols);
  const f = ws.getCell(3, 1);
  f.value = `Generado: ${new Date().toLocaleString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} · ${AMBITO_CUENCA}`;
  f.font = { size: 10, italic: true, color: { argb: "FF6B7280" } };

  return 5;
}

function hojaDatos(ws: ExcelJSType.Worksheet, config: HojaDatos) {
  const span = Math.max(config.headers.length, 1);
  config.anchos.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  const inicio = encabezadoReporte(ws, config.titulo, config.subtitulo, span);
  pintarEncabezadoTabla(ws, inicio, config.headers);

  if (config.filas.length === 0) {
    ws.mergeCells(inicio + 1, 1, inicio + 1, span);
    const vacio = ws.getCell(inicio + 1, 1);
    vacio.value = "Sin registros en esta sección";
    vacio.font = { italic: true, color: { argb: "FF9CA3AF" } };
    vacio.alignment = { horizontal: "center" };
    return;
  }

  const fin = pintarFilasTabla(ws, inicio + 1, config.filas);
  ws.views = [{ state: "frozen", ySplit: inicio }];
  ws.autoFilter = {
    from: { row: inicio, column: 1 },
    to: { row: Math.max(inicio, fin - 1), column: span },
  };
}

function hojaResumen(
  wb: ExcelJSType.Workbook,
  ws: ExcelJSType.Worksheet,
  state: JaStoreState,
  logoBase64: string | null,
) {
  const headerColIni = 2;
  const headerColFin = 21;

  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 18;
  ws.getColumn(3).width = 28;
  for (let i = 4; i <= 24; i++) ws.getColumn(i).width = 3.2;

  for (let fila = 2; fila <= 4; fila++) {
    for (let col = headerColIni; col <= headerColFin; col++) {
      const c = ws.getCell(fila, col);
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
      c.border = bordeEncabezadoResumen(fila, col, 2, 4, headerColIni, headerColFin);
    }
  }

  ws.mergeCells(2, headerColIni, 4, headerColIni);
  ws.getCell(2, headerColIni).alignment = {
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
  ws.getCell(2, 3).value = TITULO_MODULO;
  ws.getCell(2, 3).font = { bold: true, size: 18, color: { argb: COLOR_AZUL_OSCURO } };
  ws.getCell(2, 3).alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  ws.mergeCells(3, 3, 3, headerColFin);
  ws.getCell(3, 3).value = GESTION_RECURSOS_HIDRICOS;
  ws.getCell(3, 3).font = { bold: true, size: 12, color: { argb: COLOR_AZUL } };

  ws.mergeCells(4, 3, 4, headerColFin);
  ws.getCell(4, 3).value = `${AMBITO_CUENCA} · Corte ${formatFechaCalendarioGt(fechaCalendarioGt())}`;
  ws.getCell(4, 3).font = { size: 10, italic: true, color: { argb: "FF6B7280" } };

  ws.getRow(1).height = 10;
  ws.getRow(2).height = 54;
  ws.getRow(3).height = 28;
  ws.getRow(4).height = 26;

  const poblacion = state.incidentes.reduce((sum, row) => sum + totalPoblacion(row), 0);
  const kpis: [string, number, string][] = [
    ["Incidentes", state.incidentes.length, COLOR_AZUL],
    ["Diálogo", state.sesiones.length, COLOR_AZUL_OSCURO],
    ["Acuerdos", state.acuerdos.length, COLOR_ORO],
    ["Pilotos", state.proyectos.length, COLOR_AZUL],
  ];

  const filaKpiValor = 6;
  const filaKpiLabel = 7;
  kpis.forEach(([label, valor, color], i) => {
    const colInicio = 2 + i * 5;
    const colFin = colInicio + 4;
    ws.mergeCells(filaKpiValor, colInicio, filaKpiValor, colFin);
    ws.mergeCells(filaKpiLabel, colInicio, filaKpiLabel, colFin);
    const cv = ws.getCell(filaKpiValor, colInicio);
    cv.value = valor;
    cv.font = { bold: true, size: 22, color: { argb: COLOR_HEADER_TXT } };
    cv.alignment = { horizontal: "center", vertical: "middle" };
    cv.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    const cl = ws.getCell(filaKpiLabel, colInicio);
    cl.value = label;
    cl.font = { bold: true, size: 10, color: { argb: COLOR_HEADER_TXT } };
    cl.alignment = { horizontal: "center", vertical: "middle" };
    cl.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
  });
  ws.getRow(filaKpiValor).height = 32;
  ws.getRow(filaKpiLabel).height = 20;

  let fila = 9;
  ws.mergeCells(fila, 2, fila, headerColFin);
  ws.getCell(fila, 2).value = `Población afectada registrada: ${poblacion} personas`;
  ws.getCell(fila, 2).font = { bold: true, size: 11, color: { argb: COLOR_TITULO_TXT } };
  fila += 2;

  pintarSubtitulo(ws, fila, "Índice de hojas del reporte", headerColFin - 1, COLOR_AZUL);
  fila += 1;
  const indiceHeaders = ["Hoja", "Sección", "Registros"];
  indiceHeaders.forEach((h, i) => {
    const c = ws.getCell(fila, 2 + i);
    c.value = h;
    c.font = { bold: true, size: 10, color: { argb: COLOR_HEADER_TXT } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
    c.border = bordeFino();
    c.alignment = { horizontal: "center" };
  });
  fila += 1;

  const indiceFilas: [string, string, string | number][] = [
    ["Central", "Resumen e indicadores", "—"],
    ["Alertas", "Conflictividades hídricas", state.incidentes.length],
    ["Mesas", "Sesiones de diálogo", state.sesiones.length],
    ["Acuerdos", "Bitácora de acuerdos", state.acuerdos.length],
    ["Metodologías", "Redes inclusivas — saberes", state.metodologias.length],
    ["Organizaciones", "Redes inclusivas — directorio", state.organizaciones.length],
    ["Pilotos", "Banco de innovación", state.proyectos.length],
    ["Evidencias", "Auditoría PBF / MARN", state.evidencias.length],
    ["Tablero", "Carga por microcuenca", MICROCUENCAS.length],
  ];

  indiceFilas.forEach(([hoja, seccion, total], idx) => {
    [hoja, seccion, total].forEach((v, i) => {
      const c = ws.getCell(fila, 2 + i);
      c.value = v;
      c.font = { size: 10, color: { argb: "FF374151" } };
      c.border = bordeFino();
      c.alignment = { horizontal: i === 2 ? "center" : "left" };
      if (idx % 2 === 1) {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ZEBRA } };
      }
    });
    fila += 1;
  });

  fila += 1;
  pintarSubtitulo(ws, fila, "Incidentes por criticidad", headerColFin - 1, COLOR_AZUL_OSCURO);
  fila += 1;

  const maxCrit = Math.max(
    ...CRITICIDADES.map((c) => state.incidentes.filter((i) => i.criticidad === c).length),
    1,
  );

  CRITICIDADES.forEach((c) => {
    const valor = state.incidentes.filter((i) => i.criticidad === c).length;
    ws.getCell(fila, 2).value = etiquetaCriticidad(c);
    ws.getCell(fila, 2).font = { size: 10, color: { argb: "FF374151" } };
    ws.getCell(fila, 3).value = valor;
    ws.getCell(fila, 3).font = { bold: true, size: 10, color: { argb: COLOR_AZUL } };
    ws.getCell(fila, 3).alignment = { horizontal: "center" };

    const llenas = Math.round((valor / maxCrit) * 16);
    for (let k = 0; k < 16; k++) {
      const bar = ws.getCell(fila, 4 + k);
      bar.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: k < llenas ? COLOR_AZUL : COLOR_BARRA_BG },
      };
    }
    ws.getRow(fila).height = 18;
    fila += 1;
  });
}

function filasAlertas(state: JaStoreState): (string | number)[][] {
  return state.incidentes.map((row) => [
    row.confidencial ? (row.id_anonimo ?? row.folio) : row.folio,
    formatFechaCalendarioGt(row.fecha),
    row.microcuenca,
    row.municipio,
    etiquetaCriticidad(row.criticidad),
    row.tipologia,
    row.descripcion,
    row.confidencial ? "Sí" : "No",
    row.derivacion,
    row.asignado_a,
    row.poblacion.hombres,
    row.poblacion.mujeres,
    row.poblacion.juventudes,
    row.poblacion.pueblo_maya_chorti,
    totalPoblacion(row),
  ]);
}

function filasMesas(state: JaStoreState): (string | number)[][] {
  return state.sesiones.map((row) => [
    row.titulo,
    formatFechaCalendarioGt(row.fecha),
    etiquetaFase(row.fase),
    row.microcuenca,
    row.municipio,
    row.incidente_id,
    row.notas ?? "",
  ]);
}

function filasAcuerdos(state: JaStoreState): (string | number)[][] {
  return state.acuerdos.map((row) => [
    row.descripcion,
    row.institucion_responsable,
    formatFechaCalendarioGt(row.fecha_limite),
    etiquetaAcuerdo(row.estado),
    row.efectividad,
    row.medio_verificacion,
    row.sesion_id,
    row.incidente_id,
  ]);
}

function filasMetodologias(state: JaStoreState): (string | number)[][] {
  return state.metodologias.map((row) => [
    row.titulo,
    row.tipo,
    row.pertinencia,
    row.microcuenca ?? AMBITO_CUENCA,
    row.resumen,
  ]);
}

function filasOrganizaciones(state: JaStoreState): (string | number)[][] {
  return state.organizaciones.map((row) => [
    row.nombre,
    row.tipo,
    row.municipio,
    row.contacto,
    row.descripcion,
    row.mujeres_liderazgo,
    row.juventudes_liderazgo,
  ]);
}

function filasPilotos(state: JaStoreState): (string | number)[][] {
  return state.proyectos.map((row) => [
    row.nombre,
    row.comunidad,
    row.microcuenca,
    row.municipio,
    row.agencia,
    row.tipologia,
    row.avance_fisico,
    formatoQ(row.presupuesto_total),
    formatoQ(row.presupuesto_ejecutado),
    row.representatividad_comunitaria,
    row.impacto_medios_vida,
    row.innovacion_climatica,
  ]);
}

function filasEvidencias(state: JaStoreState): (string | number)[][] {
  return state.evidencias.map((row) => [
    formatFechaCalendarioGt(row.fecha),
    row.titulo,
    row.tipo,
    row.etiqueta,
    row.vinculado,
  ]);
}

function filasTablero(state: JaStoreState): (string | number)[][] {
  return MICROCUENCAS.map((micro) => [
    micro,
    state.incidentes.filter((i) => i.microcuenca === micro).length,
    state.sesiones.filter((s) => s.microcuenca === micro).length,
    state.proyectos.filter((p) => p.microcuenca === micro).length,
    state.acuerdos.filter((a) => {
      const inc = state.incidentes.find((i) => i.id === a.incidente_id);
      return inc?.microcuenca === micro;
    }).length,
  ]);
}

async function guardarWorkbook(wb: ExcelJSType.Workbook, nombreBase: string) {
  const buf = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${safeFilename(nombreBase)}-${fechaCalendarioGt()}.xlsx`,
  );
}

export async function exportarModuloPazHidricaJa(state: JaStoreState) {
  const ExcelJS = await cargarExcelJS();
  const logoBase64 = await cargarLogoBase64();
  const wb = new ExcelJS.Workbook();
  wb.creator = "SIGET · Plan Trifinio";
  wb.created = new Date();

  hojaResumen(wb, wb.addWorksheet("Central"), state, logoBase64);

  hojaDatos(wb.addWorksheet("Alertas"), {
    titulo: "Alertas",
    subtitulo: "Conflictividades hídricas registradas",
    headers: [
      "Folio",
      "Fecha",
      "Microcuenca",
      "Municipio",
      "Criticidad",
      "Tipología",
      "Descripción",
      "Acción Sin Daño",
      "Derivación",
      "Unidad asignada",
      "Hombres",
      "Mujeres",
      "Juventudes",
      "Pueblo Maya Ch'orti'",
      "Total población",
    ],
    filas: filasAlertas(state),
    anchos: [18, 14, 14, 16, 18, 28, 36, 12, 22, 22, 10, 10, 10, 14, 12],
  });

  hojaDatos(wb.addWorksheet("Mesas"), {
    titulo: "Mesas",
    subtitulo: "Sesiones de concertación y diálogo",
    headers: ["Título", "Fecha", "Fase", "Microcuenca", "Municipio", "Incidente", "Notas"],
    filas: filasMesas(state),
    anchos: [32, 14, 18, 14, 16, 14, 36],
  });

  hojaDatos(wb.addWorksheet("Acuerdos"), {
    titulo: "Acuerdos",
    subtitulo: "Bitácora de compromisos y verificación",
    headers: [
      "Descripción",
      "Institución",
      "Fecha límite",
      "Estado",
      "Efectividad",
      "Medio de verificación",
      "Sesión",
      "Incidente",
    ],
    filas: filasAcuerdos(state),
    anchos: [36, 16, 14, 14, 12, 28, 14, 14],
  });

  hojaDatos(wb.addWorksheet("Metodologías"), {
    titulo: "Metodologías",
    subtitulo: "Redes inclusivas — saberes y guías",
    headers: ["Título", "Tipo", "Pertinencia", "Microcuenca", "Resumen"],
    filas: filasMetodologias(state),
    anchos: [32, 18, 28, 14, 40],
  });

  hojaDatos(wb.addWorksheet("Organizaciones"), {
    titulo: "Organizaciones",
    subtitulo: "Directorio de articulación comunitaria",
    headers: [
      "Organización",
      "Tipo",
      "Municipio",
      "Contacto",
      "Descripción",
      "Mujeres",
      "Juventudes",
    ],
    filas: filasOrganizaciones(state),
    anchos: [28, 16, 16, 22, 36, 10, 10],
  });

  hojaDatos(wb.addWorksheet("Pilotos"), {
    titulo: "Pilotos",
    subtitulo: "Banco de innovación y proyectos piloto",
    headers: [
      "Proyecto",
      "Comunidad",
      "Microcuenca",
      "Municipio",
      "Agencia",
      "Tipología",
      "Avance %",
      "Presupuesto total",
      "Ejecutado",
      "Representatividad %",
      "Medios de vida",
      "Innovación climática",
    ],
    filas: filasPilotos(state),
    anchos: [32, 18, 14, 16, 12, 22, 10, 16, 16, 14, 12, 14],
  });

  hojaDatos(wb.addWorksheet("Evidencias"), {
    titulo: "Evidencias",
    subtitulo: "Auditoría PBF / MARN",
    headers: ["Fecha", "Título", "Tipo", "Seguridad", "Vínculo"],
    filas: filasEvidencias(state),
    anchos: [14, 32, 16, 24, 28],
  });

  hojaDatos(wb.addWorksheet("Tablero"), {
    titulo: "Tablero",
    subtitulo: "Carga territorial por microcuenca",
    headers: ["Microcuenca", "Incidentes", "Sesiones", "Pilotos", "Acuerdos"],
    filas: filasTablero(state),
    anchos: [18, 12, 12, 12, 12],
  });

  await guardarWorkbook(wb, "paz-hidrica-ja");
}

export async function exportarReporteEjecutivo(state: JaStoreState) {
  await exportarModuloPazHidricaJa(state);
}

export async function exportarEvidencias(state: JaStoreState) {
  const ExcelJS = await cargarExcelJS();
  const logoBase64 = await cargarLogoBase64();
  const wb = new ExcelJS.Workbook();
  wb.creator = "SIGET · Plan Trifinio";
  wb.created = new Date();

  hojaResumen(wb, wb.addWorksheet("Central"), state, logoBase64);
  hojaDatos(wb.addWorksheet("Evidencias"), {
    titulo: "Evidencias",
    subtitulo: "Listado para auditoría PBF / MARN",
    headers: ["Fecha", "Título", "Tipo", "Seguridad", "Vínculo"],
    filas: filasEvidencias(state),
    anchos: [14, 32, 16, 24, 28],
  });

  await guardarWorkbook(wb, "evidencias-paz-hidrica-ja");
}
