import { differenceInMinutes } from "date-fns";
import { type SolicitudRow } from "./zod";

export function estadoBadgeClass(estado: SolicitudRow["estado"]) {
  if (estado === "PENDIENTE") return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
  if (estado === "APROBADA") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
  if (estado === "EN_MISION") return "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400";
  if (estado === "RECHAZADA") return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
}

export function formatEstadoLabel(estado: SolicitudRow["estado"]) {
  return estado.replace("_", " ");
}

export function formatDuracionMision(inicio: string, fin: string): string {
  const start = new Date(inicio);
  const end = new Date(fin);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return "—";

  const totalMinutes = differenceInMinutes(end, start);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (days > 0) parts.push(`${days} día${days !== 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes} min`);

  return parts.join(" ") || "—";
}

export function solicitudPendienteVencida(
  solicitud: Pick<SolicitudRow, "estado" | "fecha_inicio">,
): boolean {
  if (solicitud.estado !== "PENDIENTE") return false;
  const inicio = new Date(solicitud.fecha_inicio);
  if (Number.isNaN(inicio.getTime())) return false;
  return inicio.getTime() < Date.now();
}
