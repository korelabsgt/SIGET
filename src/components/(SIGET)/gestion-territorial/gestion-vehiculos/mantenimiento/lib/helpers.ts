import { type FallaRow } from "./zod";

export function severidadBadgeClass(severidad: FallaRow["severidad"]) {
  if (severidad === "ALTA") return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
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
