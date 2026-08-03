import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { TITULO_INFORME_MEMORIA } from "./zod";
import {
  formatPeriodo,
  formatoOrdinalCortoEs,
} from "./helpers";
import type { ProyectoItem } from "./zod";

export type MemoriaProyectoExcelContext = {
  nombre?: string | null;
  oficina?: string | null;
  cargo?: string | null;
  periodoLabel: string;
  reporteRealizado?: string | null;
};

function textoJerarquia(oficina?: string | null, cargo?: string | null): string {
  return [oficina, cargo]
    .filter((s) => s?.trim())
    .map((s) => s!.trim().replace(/\s*\/\s*/g, " · "))
    .join(" · ");
}

function safeFilename(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "proyecto"
  );
}

function pctAvance(logrado: number, meta: number): string {
  if (meta <= 0) return "0%";
  return `${Math.min(100, Math.round((logrado / meta) * 100))}%`;
}

export function buildProyectoMemoriaExcelRows(
  proyecto: ProyectoItem,
  index: number,
  context: MemoriaProyectoExcelContext,
): unknown[][] {
  const rows: unknown[][] = [];

  rows.push([TITULO_INFORME_MEMORIA]);
  rows.push([]);
  rows.push(["Quien reporta"]);
  rows.push(["Nombre", context.nombre?.trim() || "—"]);
  rows.push([
    "Dependencia jerárquica",
    textoJerarquia(context.oficina, context.cargo) || "—",
  ]);
  rows.push(["Período del informe", context.periodoLabel]);
  if (context.reporteRealizado?.trim()) {
    rows.push(["Reporte realizado", context.reporteRealizado]);
  }
  rows.push([]);
  rows.push([`Proyecto ${formatoOrdinalCortoEs(index + 1)}`]);
  rows.push(["Nombre del proyecto", proyecto.nombre.trim() || "—"]);
  rows.push(["Mes de ejecución", formatPeriodo(proyecto.mes)]);
  rows.push(["Descripción del proyecto", proyecto.descripcion.trim() || "—"]);
  rows.push([]);
  rows.push(["Beneficiarios directos"]);
  rows.push(["Hombres", "Mujeres", "Jóvenes", "Total"]);
  const directos = proyecto.beneficiarios.directos;
  rows.push([
    directos.hombres,
    directos.mujeres,
    directos.jovenes,
    directos.hombres + directos.mujeres + directos.jovenes,
  ]);
  rows.push([]);
  rows.push(["Beneficiarios indirectos"]);
  rows.push(["Hombres", "Mujeres", "Jóvenes", "Total"]);
  const indirectos = proyecto.beneficiarios.indirectos;
  rows.push([
    indirectos.hombres,
    indirectos.mujeres,
    indirectos.jovenes,
    indirectos.hombres + indirectos.mujeres + indirectos.jovenes,
  ]);
  rows.push([]);

  const avances = proyecto.avances.filter(
    (a) => a.descripcion.trim() || a.logrado > 0 || a.meta > 0,
  );
  if (avances.length > 0) {
    rows.push(["Avances por proyecto"]);
    rows.push(["#", "Descripción del indicador", "Logrado", "Meta", "% avance"]);
    avances.forEach((avance, j) => {
      rows.push([
        j + 1,
        avance.descripcion.trim() || "—",
        avance.logrado,
        avance.meta,
        pctAvance(avance.logrado, avance.meta),
      ]);
    });
    rows.push([]);
  }

  const resultados = proyecto.resultados.filter((r) => r.trim());
  if (resultados.length > 0) {
    rows.push(["Principales resultados"]);
    rows.push(["#", "Resultado"]);
    resultados.forEach((resultado, j) => {
      rows.push([j + 1, resultado]);
    });
    rows.push([]);
  }

  const efectos = proyecto.efectos.filter((e) => e.trim());
  if (efectos.length > 0) {
    rows.push(["Efectos alcanzados"]);
    rows.push(["#", "Efecto"]);
    efectos.forEach((efecto, j) => {
      rows.push([j + 1, efecto]);
    });
  }

  return rows;
}

function downloadRows(rows: unknown[][], filename: string) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Proyecto");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
  );
}

export function downloadProyectoMemoriaExcel(
  proyecto: ProyectoItem,
  index: number,
  context: MemoriaProyectoExcelContext,
) {
  const rows = buildProyectoMemoriaExcelRows(proyecto, index, context);
  const nombreBase = safeFilename(
    proyecto.nombre.trim() || `proyecto-${index + 1}`,
  );
  const mesBase = proyecto.mes.replace("-", "");
  downloadRows(rows, `memoria-${nombreBase}-${mesBase}.xlsx`);
}
