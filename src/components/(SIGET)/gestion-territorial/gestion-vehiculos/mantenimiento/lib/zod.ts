import { z } from "zod";

export const FallaMantenimientoSchema = z.object({
  vehiculo_id: z.string().uuid("Debe seleccionar un vehículo válido."),
  severidad: z.enum(["BAJA", "MEDIA", "ALTA"], {
    message: "La severidad es obligatoria.",
  }),
  descripcion: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  evidencia_url: z.string().url("Debe ser una URL válida.").optional().or(z.literal("")),
});

export type FallaMantenimientoFormData = z.infer<typeof FallaMantenimientoSchema>;

export const AtenderFallaSchema = z.object({
  falla_id: z.string().uuid(),
  mecanico_id: z.string().uuid().optional().or(z.literal("")),
  taller_externo: z.string().optional(),
}).refine(data => data.mecanico_id || data.taller_externo, {
  message: "Debe asignar un mecánico o especificar un taller externo.",
  path: ["mecanico_id"], // Error shown at mecanico_id by default
});

export type AtenderFallaFormData = z.infer<typeof AtenderFallaSchema>;

export const SolventarFallaSchema = z.object({
  falla_id: z.string().uuid(),
  diagnostico: z.string().min(5, "El diagnóstico es requerido y debe ser claro."),
  reparacion_detalle: z.string().min(5, "El detalle de la reparación es requerido."),
});

export type SolventarFallaFormData = z.infer<typeof SolventarFallaSchema>;

export const vehiculoFallaOptionSchema = z.object({
  id: z.string(),
  placa: z.string(),
  marca: z.string(),
  modelo: z.string(),
  estado: z.string().optional(),
});

export type VehiculoFallaOption = z.infer<typeof vehiculoFallaOptionSchema>;

export const mecanicoOptionSchema = z.object({
  id: z.string(),
  nombre: z.string().nullable(),
});

export type MecanicoOption = z.infer<typeof mecanicoOptionSchema>;

export const fallaRowSchema = z.object({
  id: z.string(),
  vehiculo_id: z.string(),
  reportado_por: z.string(),
  mecanico_id: z.string().nullable(),
  severidad: z.enum(["BAJA", "MEDIA", "ALTA"]),
  descripcion: z.string(),
  evidencia_url: z.string().nullable(),
  diagnostico: z.string().nullable(),
  reparacion_detalle: z.string().nullable(),
  taller_externo: z.string().nullable(),
  estado: z.enum(["PENDIENTE", "EN_REPARACION", "SOLVENTADA"]),
  created_at: z.string(),
  solventado_at: z.string().nullable(),
  vehiculo: z.object({
    placa: z.string(),
    marca: z.string(),
    modelo: z.string(),
  }),
  reportador: z.object({ nombre: z.string() }),
  mecanico: z.object({ nombre: z.string() }).nullable(),
});

export type FallaRow = z.infer<typeof fallaRowSchema>;
