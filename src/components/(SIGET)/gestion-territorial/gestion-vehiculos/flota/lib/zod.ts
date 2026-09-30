import { z } from "zod";
import { fechaManualToTimestamptz } from "../../lib/fechas-input";

export const ESTADOS_VEHICULO = [
  "LIBRE",
  "RESERVADO",
  "EN_MANTENIMIENTO",
  "RESERVA_INDIVIDUAL",
] as const;

const fechaManualOpcional = z
  .string()
  .nullable()
  .optional()
  .superRefine((val, ctx) => {
    if (val == null || !String(val).trim()) return;
    if (!fechaManualToTimestamptz(String(val))) {
      ctx.addIssue({
        code: "custom",
        message: "Fecha inválida. Escriba DD/MM/AAAA",
      });
    }
  })
  .transform((val) => {
    if (val == null || !String(val).trim()) return null;
    return fechaManualToTimestamptz(String(val));
  });

export const vehiculoSchema = z.object({
  id: z.string().uuid().optional(),
  placa: z.string().trim().min(1, "La placa es obligatoria").toUpperCase(),
  marca: z.string().trim().min(1, "La marca es obligatoria"),
  modelo: z.string().trim().min(1, "El modelo es obligatorio"),
  color: z.string().trim().min(1, "El color es obligatorio"),
  anio: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1900, "Año inválido")
    .max(new Date().getFullYear() + 1, "Año inválido")
    .nullable()
    .optional(),
  kilometraje_actual: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(0, "El kilometraje no puede ser negativo")
    .default(0),
  km_referencia_servicio: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(0, "La referencia de servicio no puede ser negativa")
    .optional(),
  estado: z.enum(ESTADOS_VEHICULO).default("LIBRE"),
  reserva_usuario_id: z.string().uuid().nullable().optional(),
  vencimiento_seguro: fechaManualOpcional,
  vencimiento_circulacion: fechaManualOpcional,
  imagen_url: z.array(z.string()).max(6).default([]),
  created_at: z.string().optional(),
});

export const vehiculoInputBaseSchema = vehiculoSchema.omit({
  id: true,
  created_at: true,
});

export const vehiculoInputSchema = vehiculoInputBaseSchema.superRefine((data, ctx) => {
  if (data.estado !== "RESERVA_INDIVIDUAL") return;
  const raw = data.reserva_usuario_id;
  const usuarioId = typeof raw === "string" ? raw.trim() : "";
  if (!usuarioId) {
    ctx.addIssue({
      code: "custom",
      message: "Selecciona el usuario para la reserva individual.",
      path: ["reserva_usuario_id"],
    });
  }
});

export type VehiculoRow = z.infer<typeof vehiculoSchema>;
export type VehiculoInput = z.infer<typeof vehiculoInputBaseSchema>;
export type EstadoVehiculo = (typeof ESTADOS_VEHICULO)[number];

export const ALERT_STATUS = ["VERDE", "AMARILLO", "ROJO"] as const;
export type AlertStatus = (typeof ALERT_STATUS)[number];
