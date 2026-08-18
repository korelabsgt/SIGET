import { z } from "zod";

export const bitacoraInputSchema = z.object({
  solicitud_id: z.string().optional().nullable(),
  vehiculo_id: z.string().min(1, { message: "Debe seleccionar un vehículo" }),
  conductor_id: z.string().min(1, { message: "Debe seleccionar un conductor" }),
  destino: z.string().min(3, { message: "El destino debe tener al menos 3 caracteres" }),
  km_inicial: z.coerce.number().int().min(0, { message: "Debe ser un número válido" }),
  km_final: z.coerce.number().int().min(0, { message: "Debe ser un número válido" }),
  vale_combustible: z.string().optional().nullable(),
  monto_combustible: z.coerce.number().min(0).default(0),
  checklist_pre: z.record(z.string(), z.boolean()).optional().default({}),
  checklist_post: z.record(z.string(), z.boolean()).optional().default({}),
}).refine((data) => data.km_final >= data.km_inicial, {
  message: "El kilometraje final debe ser mayor o igual al inicial",
  path: ["km_final"],
});

export type BitacoraInput = z.infer<typeof bitacoraInputSchema>;

export type BitacoraRow = {
  id: string;
  solicitud_id: string | null;
  vehiculo_id: string;
  conductor_id: string;
  fecha: string;
  destino: string;
  km_inicial: number;
  km_final: number;
  km_recorrido: number;
  vale_combustible: string | null;
  monto_combustible: number;
  checklist_pre: Record<string, boolean>;
  checklist_post: Record<string, boolean>;
  created_at: string;
  
  // Enriched fields from joins
  ter_vehiculos?: {
    placa: string;
    marca: string;
    modelo: string;
  };
  profiles?: {
    full_name: string;
  };
};
