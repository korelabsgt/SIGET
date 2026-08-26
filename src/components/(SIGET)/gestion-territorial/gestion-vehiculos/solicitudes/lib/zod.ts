import { z } from "zod";
import { parseFechaHoraManualToIso } from "../../lib/fechas-input";

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
      if (!parseFechaHoraManualToIso(val)) {
        ctx.addIssue({
          code: "custom",
          message: "Fecha inválida. Escriba DD/MM/AAAA HH:mm",
        });
      }
    })
    .transform((val) => parseFechaHoraManualToIso(val));

export const solicitudInputSchema = z
  .object({
    fecha_inicio: fechaHoraManual("La fecha de inicio es requerida"),
    fecha_fin_estimada: fechaHoraManual("La fecha fin estimada es requerida"),
    destino: z.string().min(3, "El destino debe tener al menos 3 caracteres"),
    ruta_planificada: z.string().optional(),
    justificacion: z.string().min(10, "La justificación debe ser detallada (min 10 caracteres)"),
    pasajeros: z.string().optional(),
    vehiculo_id: z.string().uuid("Vehículo inválido").optional().nullable().or(z.literal("")),
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
    }
  );

export type SolicitudInput = z.infer<typeof solicitudInputSchema>;

export interface SolicitudRow {
  id: string;
  solicitante_id: string;
  vehiculo_id: string | null;
  fecha_inicio: string;
  fecha_fin_estimada: string;
  destino: string;
  ruta_planificada: string | null;
  justificacion: string;
  pasajeros: string | null;
  estado: typeof ESTADOS_SOLICITUD[number];
  aprobado_por: string | null;
  created_at: string;
  
  // Virtual / Joins
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
