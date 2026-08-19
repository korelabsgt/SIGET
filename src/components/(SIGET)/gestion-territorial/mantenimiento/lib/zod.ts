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
