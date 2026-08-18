import { z } from "zod";

export const ESTADOS_VEHICULO = ["LIBRE", "RESERVADO", "EN_MANTENIMIENTO"] as const;

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
  estado: z.enum(ESTADOS_VEHICULO).default("LIBRE"),
  vencimiento_seguro: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val).toISOString() : null)),
  vencimiento_circulacion: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val).toISOString() : null)),
  created_at: z.string().optional(),
});

export const vehiculoInputSchema = vehiculoSchema.omit({
  id: true,
  created_at: true,
});

export type VehiculoRow = z.infer<typeof vehiculoSchema>;
export type VehiculoInput = z.infer<typeof vehiculoInputSchema>;
export type EstadoVehiculo = (typeof ESTADOS_VEHICULO)[number];
