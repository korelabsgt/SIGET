import { z } from "zod";

export const ESTADOS_SOLICITUD_COMBUSTIBLE = ["PENDIENTE", "APROBADO", "RECHAZADO"] as const;

export type EstadoSolicitudCombustible = (typeof ESTADOS_SOLICITUD_COMBUSTIBLE)[number];

export const solicitudCombustibleInputSchema = z.object({
  vehiculo_id: z.string().uuid("Seleccione un vehículo"),
  solicitud_vehiculo_id: z
    .string()
    .uuid("Solicitud de vehículo inválida")
    .optional()
    .nullable()
    .or(z.literal("")),
  comentarios: z.string().trim().max(2000).optional().nullable(),
});

export type SolicitudCombustibleInput = z.infer<typeof solicitudCombustibleInputSchema>;

export const resolverSolicitudCombustibleSchema = z
  .object({
    accion: z.enum(["APROBAR", "RECHAZAR"]),
    requisicion_id: z.string().uuid().optional(),
    cantidad_cupones: z.coerce.number().int().min(1).optional(),
    comentarios: z.string().trim().max(2000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.accion === "APROBAR") {
      if (!data.requisicion_id) {
        ctx.addIssue({
          code: "custom",
          message: "Seleccione el lote de cupones",
          path: ["requisicion_id"],
        });
      }
      if (!data.cantidad_cupones || data.cantidad_cupones < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Indique cuántos cupones entregar",
          path: ["cantidad_cupones"],
        });
      }
    }
  });

export type ResolverSolicitudCombustibleInput = z.infer<typeof resolverSolicitudCombustibleSchema>;

export type SolicitudCombustibleVehiculoVinculo = {
  id: string;
  destino: string;
  fecha_inicio: string;
  fecha_fin_estimada: string;
  estado: string;
  vehiculo_id: string | null;
  piloto: string | null;
  solicitante_id: string;
  solicitante?: {
    id: string;
    nombre: string | null;
    email: string | null;
  } | null;
  piloto_profile?: {
    id: string;
    nombre: string | null;
    email: string | null;
  } | null;
};

export type SolicitudCombustibleRow = {
  id: string;
  vehiculo_id: string;
  solicitud_vehiculo_id: string | null;
  cupon_del: number | null;
  cupon_al: number | null;
  denominacion_cupon: number | null;
  solicitante_id: string;
  entregante_id: string | null;
  estado: EstadoSolicitudCombustible;
  comentarios: string | null;
  fecha_solicitud: string;
  fecha_aprobacion: string | null;
  url_comprobante: string | null;
  created_at: string;
  vehiculo?: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    anio?: number | null;
  } | null;
  solicitante?: {
    id: string;
    nombre: string | null;
    email: string | null;
  } | null;
  entregante?: {
    id: string;
    nombre: string | null;
    email: string | null;
  } | null;
  solicitud_vehiculo?: SolicitudCombustibleVehiculoVinculo | null;
};
