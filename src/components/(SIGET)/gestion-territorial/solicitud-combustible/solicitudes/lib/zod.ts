import { z } from "zod";

export const ESTADOS_SOLICITUD_COMBUSTIBLE = ["PENDIENTE", "APROBADO", "RECHAZADO"] as const;

export type EstadoSolicitudCombustible = (typeof ESTADOS_SOLICITUD_COMBUSTIBLE)[number];

export const solicitudCombustibleInputSchema = z.object({
  vehiculo_id: z.string().uuid("Seleccione un vehículo"),
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

export type SolicitudCombustibleRow = {
  id: string;
  vehiculo_id: string;
  cupon_del: number | null;
  cupon_al: number | null;
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
};
