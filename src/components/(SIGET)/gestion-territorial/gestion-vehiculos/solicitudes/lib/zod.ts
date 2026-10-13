import { z } from "zod";
import { coerceFechaSolicitudIsoGt } from "../../lib/fechas-input";
import {
  fechaCalendarioDesdeIso,
  validarFechasMisionNoAnterioresAHoyGt,
} from "./calendario-reservas";

function validarFechasMisionSolicitud(fechaInicioIso: string, fechaFinIso: string) {
  const diaInicio = fechaCalendarioDesdeIso(fechaInicioIso);
  const diaFin = fechaCalendarioDesdeIso(fechaFinIso);

  if (!diaInicio || !diaFin || diaFin < diaInicio) {
    return {
      ok: false as const,
      path: "fecha_fin_estimada" as const,
      message: "El retorno estimado no puede ser anterior a la fecha de salida.",
    };
  }

  const fechas = validarFechasMisionNoAnterioresAHoyGt(fechaInicioIso, fechaFinIso);
  if (!fechas.ok) return fechas;

  const ini = new Date(fechaInicioIso).getTime();
  const fin = new Date(fechaFinIso).getTime();
  if (Number.isNaN(ini) || Number.isNaN(fin) || fin <= ini) {
    return {
      ok: false as const,
      path: "fecha_fin_estimada" as const,
      message:
        diaInicio === diaFin
          ? "El retorno debe ser posterior a la hora de salida."
          : "El retorno debe ser posterior a la salida (revise día y hora).",
    };
  }
  return { ok: true as const };
}

export const ESTADOS_SOLICITUD = [
  "PENDIENTE",
  "APROBADA",
  "EN_MISION",
  "RECHAZADA",
  "FINALIZADA",
] as const;

const fechaManualSolicitud = (requerido: string, modo: "inicio" | "fin") =>
  z
    .string()
    .trim()
    .min(1, requerido)
    .superRefine((val, ctx) => {
      if (!coerceFechaSolicitudIsoGt(val, modo)) {
        ctx.addIssue({
          code: "custom",
          message: "Fecha u hora inválida. Use DD/MM/AAAA o DD/MM/AAAA HH:mm",
        });
      }
    })
    .transform((val) => coerceFechaSolicitudIsoGt(val, modo));

export const PILOTO_MODO = ["solicitante", "otro"] as const;
export type PilotoModo = (typeof PILOTO_MODO)[number];

export const solicitudInputSchema = z
  .object({
    fecha_inicio: fechaManualSolicitud("La fecha de salida es requerida", "inicio"),
    fecha_fin_estimada: fechaManualSolicitud(
      "La fecha estimada de retorno es requerida",
      "fin",
    ),
    destino: z.string().min(3, "El destino debe tener al menos 3 caracteres"),
    justificacion: z.string().min(10, "La justificación debe ser detallada (min 10 caracteres)"),
    pasajeros: z.string().optional(),
    vehiculo_id: z.string().uuid("Vehículo inválido").optional().nullable().or(z.literal("")),
    piloto_modo: z.enum(PILOTO_MODO),
    piloto_id: z.string().optional(),
    solicitante_id: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const fechas = validarFechasMisionSolicitud(data.fecha_inicio, data.fecha_fin_estimada);
    if (!fechas.ok) {
      ctx.addIssue({
        code: "custom",
        message: fechas.message,
        path: [fechas.path],
      });
    }
  })
  .superRefine((data, ctx) => {
    const id = data.solicitante_id?.trim() ?? "";
    if (!id) return;
    if (!z.string().uuid().safeParse(id).success) {
      ctx.addIssue({
        code: "custom",
        message: "Solicitante inválido",
        path: ["solicitante_id"],
      });
    }
  })
  .superRefine((data, ctx) => {
    if (data.piloto_modo !== "otro") return;
    const id = data.piloto_id?.trim() ?? "";
    if (!id) {
      ctx.addIssue({
        code: "custom",
        message: "Busque y seleccione al piloto",
        path: ["piloto_id"],
      });
      return;
    }
    if (!z.string().uuid().safeParse(id).success) {
      ctx.addIssue({
        code: "custom",
        message: "Piloto inválido",
        path: ["piloto_id"],
      });
    }
  });

export type SolicitudInput = z.infer<typeof solicitudInputSchema>;

export const SOLICITUD_WIZARD_PASOS = 2;

export const solicitudWizardPaso1Schema = z
  .object({
    solicitante_id: z.string().optional(),
    vehiculo_id: z.string().uuid("Seleccione un vehículo de la flota"),
    fecha_inicio: fechaManualSolicitud("La fecha de salida es requerida", "inicio"),
    fecha_fin_estimada: fechaManualSolicitud(
      "La fecha estimada de retorno es requerida",
      "fin",
    ),
  })
  .superRefine((data, ctx) => {
    const id = data.solicitante_id?.trim() ?? "";
    if (!id) return;
    if (!z.string().uuid().safeParse(id).success) {
      ctx.addIssue({
        code: "custom",
        message: "Solicitante inválido",
        path: ["solicitante_id"],
      });
    }
  })
  .superRefine((data, ctx) => {
    const fechas = validarFechasMisionSolicitud(data.fecha_inicio, data.fecha_fin_estimada);
    if (!fechas.ok) {
      ctx.addIssue({
        code: "custom",
        message: fechas.message,
        path: [fechas.path],
      });
    }
  });

export const solicitudWizardPaso2Schema = z
  .object({
    destino: z.string().min(3, "El destino debe tener al menos 3 caracteres"),
    piloto_modo: z.enum(PILOTO_MODO),
    piloto_id: z.string().optional(),
    justificacion: z.string().min(10, "La justificación debe ser detallada (min 10 caracteres)"),
    pasajeros: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.piloto_modo !== "otro") return;
    const id = data.piloto_id?.trim() ?? "";
    if (!id) {
      ctx.addIssue({
        code: "custom",
        message: "Busque y seleccione al piloto",
        path: ["piloto_id"],
      });
      return;
    }
    if (!z.string().uuid().safeParse(id).success) {
      ctx.addIssue({
        code: "custom",
        message: "Piloto inválido",
        path: ["piloto_id"],
      });
    }
  });

export const rechazoSolicitudComentarioSchema = z
  .string()
  .trim()
  .min(5, "Indique el motivo del rechazo (mín. 5 caracteres)")
  .max(2000, "El comentario es demasiado largo");

export const aprobacionSolicitudComentarioOpcionalSchema = z
  .string()
  .trim()
  .max(2000, "El comentario es demasiado largo")
  .refine((s) => s.length === 0 || s.length >= 5, {
    message: "Si escribe un comentario, use al menos 5 caracteres.",
  })
  .transform((s) => (s.length === 0 ? null : s));

export interface SolicitudRow {
  id: string;
  solicitante_id: string;
  vehiculo_id: string | null;
  fecha_inicio: string;
  fecha_fin_estimada: string;
  destino: string;
  justificacion: string;
  pasajeros: string | null;
  piloto: string | null;
  estado: typeof ESTADOS_SOLICITUD[number];
  aprobado_por: string | null;
  comentarios: string | null;
  created_at: string;

  solicitante?: {
    id: string;
    nombre: string;
    email: string;
  };
  aprobador?: {
    id: string;
    nombre: string;
    email: string;
  };
  piloto_profile?: {
    id: string;
    nombre: string;
    email: string;
  };
  vehiculo?: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    color?: string | null;
    kilometraje_actual?: number | null;
    estado?: string | null;
  };
}
