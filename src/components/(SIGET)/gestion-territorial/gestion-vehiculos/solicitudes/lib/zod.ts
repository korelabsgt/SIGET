import { z } from "zod";
import { parseFechaHoraManualToIso } from "../../lib/fechas-input";
import {
  esMinutoCuartoSolicitud,
  validarFechasMisionNoAnterioresAHoyGt,
} from "./calendario-reservas";
import { partesFechaHoraGt } from "@/lib/fechas-gt";

export const ESTADOS_SOLICITUD = [
  "PENDIENTE",
  "APROBADA",
  "EN_MISION",
  "RECHAZADA",
  "FINALIZADA",
] as const;

const fechaHoraManual = (requerido: string) =>
  z
    .string()
    .trim()
    .min(1, requerido)
    .superRefine((val, ctx) => {
      const iso = parseFechaHoraManualToIso(val);
      if (!iso) {
        ctx.addIssue({
          code: "custom",
          message: "Fecha inválida. Escriba DD/MM/AAAA HH:mm",
        });
        return;
      }
      const { minute } = partesFechaHoraGt(new Date(iso));
      if (!esMinutoCuartoSolicitud(minute)) {
        ctx.addIssue({
          code: "custom",
          message: "Los minutos deben ser 00, 15, 30 o 45",
        });
      }
    })
    .transform((val) => parseFechaHoraManualToIso(val));

export const PILOTO_MODO = ["solicitante", "otro"] as const;

export const solicitudInputSchema = z
  .object({
    fecha_inicio: fechaHoraManual("La fecha de inicio es requerida"),
    fecha_fin_estimada: fechaHoraManual("La fecha fin estimada es requerida"),
    destino: z.string().min(3, "El destino debe tener al menos 3 caracteres"),
    justificacion: z.string().min(10, "La justificación debe ser detallada (min 10 caracteres)"),
    pasajeros: z.string().optional(),
    vehiculo_id: z.string().uuid("Vehículo inválido").optional().nullable().or(z.literal("")),
    piloto_modo: z.enum(PILOTO_MODO),
    piloto_id: z.string().optional(),
    solicitante_id: z.string().optional(),
  })
  .refine(
    (data) => {
      const inicio = new Date(data.fecha_inicio).getTime();
      const fin = new Date(data.fecha_fin_estimada).getTime();
      return fin > inicio;
    },
    {
      message: "La fecha de fin estimada debe ser posterior a la fecha de inicio",
      path: ["fecha_fin_estimada"],
    },
  )
  .superRefine((data, ctx) => {
    const fechas = validarFechasMisionNoAnterioresAHoyGt(
      data.fecha_inicio,
      data.fecha_fin_estimada,
    );
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

export const rechazoSolicitudComentarioSchema = z
  .string()
  .trim()
  .min(5, "Indique el motivo del rechazo (mín. 5 caracteres)")
  .max(2000, "El comentario es demasiado largo");

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
