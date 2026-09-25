import {
  TIMEZONE_GT,
  fechaCalendarioGt,
  instanteGtDesdePartesCalendario,
  normalizarFechaCalendario,
  partesFechaHoraGt,
} from "@/lib/fechas-gt";

import type { SolicitudRow } from "./zod";

export const ESTADOS_SOLICITUD_OCUPAN_DIA = [
  "PENDIENTE",
  "APROBADA",
  "EN_MISION",
] as const;

export type SolicitudCalendarioRef = Pick<
  SolicitudRow,
  "id" | "vehiculo_id" | "estado" | "fecha_inicio" | "fecha_fin_estimada"
>;

export function fechaCalendarioDesdeIso(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return fechaCalendarioGt(date);
}

export function instanteMinimoPosteriorGt(iso: string): number | null {
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return ms + 60_000;
}

export type PisoPickerSolicitudGt = {
  calendarioMin: string;
  msMin: number;
  hourMin: number;
  minuteMin: number;
};

export function pisoPickerSolicitudGt(pisoIso?: string | null): PisoPickerSolicitudGt {
  const ahora = partesFechaHoraGt();
  const hoy = ahora.calendario;
  const msAhora = instanteGtDesdePartesCalendario(
    ahora.calendario,
    ahora.hour,
    ahora.minute,
  );

  let calendarioMin = hoy;
  let msMin = msAhora;
  let hourMin = ahora.hour;
  let minuteMin = ahora.minute;

  if (pisoIso) {
    const msPiso = instanteMinimoPosteriorGt(pisoIso);
    const diaPiso = fechaCalendarioDesdeIso(pisoIso);
    if (msPiso !== null && diaPiso) {
      if (diaPiso > hoy) {
        calendarioMin = diaPiso;
        msMin = msPiso;
        const partes = partesFechaHoraGt(new Date(msPiso));
        hourMin = partes.hour;
        minuteMin = partes.minute;
      } else if (msPiso > msMin) {
        msMin = msPiso;
        const partes = partesFechaHoraGt(new Date(msPiso));
        hourMin = partes.hour;
        minuteMin = partes.minute;
      }
    }
  }

  return { calendarioMin, msMin, hourMin, minuteMin };
}

export function validarFechasMisionNoAnterioresAHoyGt(
  fechaInicioIso: string,
  fechaFinIso: string,
):
  | { ok: true }
  | {
      ok: false;
      path: "fecha_inicio" | "fecha_fin_estimada";
      message: string;
    } {
  const hoy = fechaCalendarioGt();
  const diaInicio = fechaCalendarioDesdeIso(fechaInicioIso);
  const diaFin = fechaCalendarioDesdeIso(fechaFinIso);
  const ahoraMs = Date.now();
  const inicioMs = new Date(fechaInicioIso).getTime();
  const finMs = new Date(fechaFinIso).getTime();

  if (!diaInicio || diaInicio < hoy) {
    return {
      ok: false,
      path: "fecha_inicio",
      message: "La salida no puede ser en un día anterior a hoy.",
    };
  }

  if (Number.isNaN(inicioMs) || inicioMs < ahoraMs) {
    return {
      ok: false,
      path: "fecha_inicio",
      message: "La salida no puede ser anterior a la hora actual.",
    };
  }

  if (!diaFin || diaFin < hoy) {
    return {
      ok: false,
      path: "fecha_fin_estimada",
      message: "El retorno estimado no puede ser en un día anterior a hoy.",
    };
  }

  if (Number.isNaN(finMs) || finMs < ahoraMs) {
    return {
      ok: false,
      path: "fecha_fin_estimada",
      message: "El retorno estimado no puede ser anterior a la hora actual.",
    };
  }

  return { ok: true };
}

export function siguienteDiaCalendarioGt(yyyyMmDd: string): string {
  const norm = normalizarFechaCalendario(yyyyMmDd);
  if (!norm) return yyyyMmDd;
  const [y, m, d] = norm.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0));
  return fechaCalendarioGt(date);
}

function diaAnteriorCalendarioGt(yyyyMmDd: string): string {
  const norm = normalizarFechaCalendario(yyyyMmDd);
  if (!norm) return yyyyMmDd;
  const [y, m, d] = norm.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d - 1, 12, 0, 0));
  return fechaCalendarioGt(date);
}

function esMedianocheInicioDiaGt(iso: string): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE_GT,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? NaN);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? NaN);
  const second = Number(parts.find((p) => p.type === "second")?.value ?? NaN);

  return hour === 0 && minute === 0 && second === 0;
}

function ultimoDiaInclusivoReservaGt(fechaFinIso: string): string {
  const finDia = fechaCalendarioDesdeIso(fechaFinIso);
  if (!finDia) return "";
  if (esMedianocheInicioDiaGt(fechaFinIso)) {
    return diaAnteriorCalendarioGt(finDia);
  }
  return finDia;
}

export function diasReservaCalendarioGt(
  fechaInicioIso: string,
  fechaFinIso: string,
): string[] {
  const inicio = fechaCalendarioDesdeIso(fechaInicioIso);
  const fin = ultimoDiaInclusivoReservaGt(fechaFinIso);
  if (!inicio || !fin || fin < inicio) return [];

  const dias: string[] = [];
  let cursor = inicio;
  while (cursor <= fin) {
    dias.push(cursor);
    if (cursor === fin) break;
    cursor = siguienteDiaCalendarioGt(cursor);
  }
  return dias;
}

export function solicitudOcupaCalendarioVehiculo(
  solicitud: Pick<SolicitudRow, "estado" | "vehiculo_id">,
): solicitud is SolicitudCalendarioRef & { vehiculo_id: string } {
  if (!solicitud.vehiculo_id) return false;
  return (ESTADOS_SOLICITUD_OCUPAN_DIA as readonly string[]).includes(solicitud.estado);
}

export function vehiculoReservadoEnDiaCalendario(
  vehiculoId: string,
  diaCalendario: string,
  solicitudes: SolicitudCalendarioRef[],
): boolean {
  for (const sol of solicitudes) {
    if (!solicitudOcupaCalendarioVehiculo(sol)) continue;
    if (sol.vehiculo_id !== vehiculoId) continue;
    const dias = diasReservaCalendarioGt(sol.fecha_inicio, sol.fecha_fin_estimada);
    if (dias.includes(diaCalendario)) return true;
  }
  return false;
}

export function solicitudBloqueaDiaCalendario(
  solicitud: Pick<SolicitudRow, "estado" | "vehiculo_id">,
  opts: { incluirPendiente: boolean },
): solicitud is SolicitudCalendarioRef & { vehiculo_id: string } {
  if (!solicitudOcupaCalendarioVehiculo(solicitud)) return false;
  if (!opts.incluirPendiente && solicitud.estado === "PENDIENTE") return false;
  return true;
}

export function findConflictoDiaVehiculo(
  candidato: {
    id?: string;
    vehiculo_id: string;
    fecha_inicio: string;
    fecha_fin_estimada: string;
  },
  solicitudes: SolicitudCalendarioRef[],
  opts: { incluirPendiente: boolean } = { incluirPendiente: true },
): {
  dia: string;
  solicitudId: string;
  estado: SolicitudCalendarioRef["estado"];
  fecha_inicio: string;
  fecha_fin_estimada: string;
} | null {
  const diasCandidato = diasReservaCalendarioGt(
    candidato.fecha_inicio,
    candidato.fecha_fin_estimada,
  );

  for (const sol of solicitudes) {
    if (candidato.id && sol.id === candidato.id) continue;
    if (!solicitudBloqueaDiaCalendario(sol, opts)) continue;
    if (sol.vehiculo_id !== candidato.vehiculo_id) continue;

    const diasSol = diasReservaCalendarioGt(sol.fecha_inicio, sol.fecha_fin_estimada);
    for (const dia of diasCandidato) {
      if (diasSol.includes(dia)) {
        return {
          dia,
          solicitudId: sol.id,
          estado: sol.estado,
          fecha_inicio: sol.fecha_inicio,
          fecha_fin_estimada: sol.fecha_fin_estimada,
        };
      }
    }
  }
  return null;
}
