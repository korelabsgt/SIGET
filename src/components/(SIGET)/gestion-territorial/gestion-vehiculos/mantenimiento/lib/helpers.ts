import { type FallaRow } from "./zod";
import { GV_DANGER_SOFT_BADGE_CLASS } from "../../lib/gv-danger-ui";
import { normalizeVehiculoStoragePath } from "../../lib/storage";

export const FALLA_BADGE_BASE_CLASS =
  "inline-flex w-[7.25rem] items-center justify-center rounded-full px-2.5 py-0.5 text-center text-[9px] font-bold uppercase tracking-wider";

export function severidadBadgeClass(severidad: FallaRow["severidad"]) {
  if (severidad === "ALTA") return GV_DANGER_SOFT_BADGE_CLASS;
  if (severidad === "MEDIA") return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
}

export function formatSeveridadLabel(severidad: FallaRow["severidad"]) {
  if (severidad === "ALTA") return "Alta";
  if (severidad === "MEDIA") return "Media";
  return "Baja";
}

export function estadoFallaBadgeClass(estado: FallaRow["estado"]) {
  if (estado === "PENDIENTE") return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  if (estado === "EN_REPARACION") return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
}

export function formatEstadoFallaLabel(estado: FallaRow["estado"]) {
  if (estado === "PENDIENTE") return "Pendiente";
  if (estado === "EN_REPARACION") return "En reparación";
  return "Solventada";
}

export function formatVehiculoFalla(falla: FallaRow) {
  const marca = falla.vehiculo?.marca?.trim() ?? "";
  const modelo = falla.vehiculo?.modelo?.trim() ?? "";
  const nombre = `${marca} ${modelo}`.trim();
  return nombre || "Sin vehículo";
}

export type TabMantenimientoFallas = "ACTIVAS" | "CRITICAS" | "SOLVENTADAS";

export function vehiculoDisponibleParaReporteFalla(estado: string | null | undefined): boolean {
  return estado !== "EN_MANTENIMIENTO";
}

export function evidenciasFalla(falla: Pick<FallaRow, "evidencia_url">): string[] {
  const paths = falla.evidencia_url ?? [];
  const normalized = paths
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .map((url) => normalizeVehiculoStoragePath(url) ?? url.trim())
    .filter((url) => url.length > 0);
  return [...new Set(normalized)];
}

export function normalizeFallaRow(row: FallaRow): FallaRow {
  return {
    ...row,
    evidencia_url: evidenciasFalla(row),
  };
}

export type FallaAlertItem = {
  id: string;
  falla: FallaRow;
  severidad: "error" | "warn";
  titulo: string;
  detalle: string;
};

export function getMantenimientoAlerts(fallas: FallaRow[]): FallaAlertItem[] {
  const alertas: FallaAlertItem[] = [];

  for (const falla of fallas) {
    if (falla.estado === "SOLVENTADA") continue;

    const placa = falla.vehiculo?.placa?.trim() || "Vehículo";
    const descripcion = falla.descripcion?.trim() || "Sin descripción";

    if (falla.severidad === "ALTA") {
      alertas.push({
        id: falla.id,
        falla,
        severidad: "error",
        titulo: "Avería de severidad alta",
        detalle: `${placa} · ${formatEstadoFallaLabel(falla.estado)}`,
      });
      continue;
    }

    if (falla.estado === "PENDIENTE") {
      alertas.push({
        id: falla.id,
        falla,
        severidad: "warn",
        titulo: "Avería pendiente de atención",
        detalle: `${placa} · ${descripcion.slice(0, 80)}${descripcion.length > 80 ? "…" : ""}`,
      });
      continue;
    }

    if (falla.estado === "EN_REPARACION") {
      alertas.push({
        id: falla.id,
        falla,
        severidad: "warn",
        titulo: "En reparación",
        detalle: `${placa} · ${descripcion.slice(0, 80)}${descripcion.length > 80 ? "…" : ""}`,
      });
    }
  }

  return alertas.sort((a, b) => {
    if (a.severidad !== b.severidad) return a.severidad === "error" ? -1 : 1;
    return new Date(b.falla.created_at).getTime() - new Date(a.falla.created_at).getTime();
  });
}

export function filtrarFallasMantenimiento(
  fallas: FallaRow[],
  filtro: TabMantenimientoFallas,
) {
  return fallas.filter((falla) => {
    if (filtro === "ACTIVAS") {
      return falla.estado === "PENDIENTE" || falla.estado === "EN_REPARACION";
    }
    if (filtro === "CRITICAS") {
      return falla.severidad === "ALTA" && falla.estado !== "SOLVENTADA";
    }
    if (filtro === "SOLVENTADAS") {
      return falla.estado === "SOLVENTADA";
    }
    return true;
  });
}
