import { z } from "zod";

export const bitacoraComentarioInputSchema = z.object({
  texto: z.string().trim().max(500, { message: "Máximo 500 caracteres" }),
});

export type BitacoraComentarioInput = z.infer<typeof bitacoraComentarioInputSchema>;

export const bitacoraComentarioStoredSchema = z.object({
  id: z.string().uuid(),
  texto: z.string(),
  fecha: z.string(),
});

export type BitacoraComentarioStored = z.infer<typeof bitacoraComentarioStoredSchema>;

export const bitacoraComentariosJsonbSchema = z.array(bitacoraComentarioStoredSchema);

export type BitacoraComentariosJsonb = z.infer<typeof bitacoraComentariosJsonbSchema>;

export function parseComentariosJsonb(value: unknown): BitacoraComentariosJsonb {
  if (typeof value === "string") {
    try {
      return parseComentariosJsonb(JSON.parse(value));
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const texto = typeof row.texto === "string" ? row.texto.trim() : "";
      if (!texto) return null;

      const stored = bitacoraComentarioStoredSchema.safeParse({
        id: typeof row.id === "string" ? row.id : crypto.randomUUID(),
        texto,
        fecha: typeof row.fecha === "string" ? row.fecha : new Date().toISOString(),
      });
      return stored.success ? stored.data : null;
    })
    .filter((item): item is BitacoraComentarioStored => item !== null);
}

export function toComentariosJsonbPayload(
  comentarios: BitacoraComentarioInput[],
): BitacoraComentariosJsonb {
  const ahora = new Date().toISOString();
  return comentarios
    .map((c) => ({ texto: c.texto.trim() }))
    .filter((c) => c.texto.length > 0)
    .map((c) => ({
      id: crypto.randomUUID(),
      texto: c.texto,
      fecha: ahora,
    }));
}

export const bitacoraInputSchema = z
  .object({
    solicitud_id: z.string().optional().nullable(),
    vehiculo_id: z.string().min(1, { message: "Debe seleccionar un vehículo" }),
    conductor_id: z.string().optional(),
    destino: z.string().min(3, { message: "El destino debe tener al menos 3 caracteres" }),
    km_inicial: z.coerce.number().int().min(0, { message: "Debe ser un número válido" }),
    km_final: z.coerce.number().int().min(0, { message: "Debe ser un número válido" }),
    vale_combustible: z.string().optional().nullable(),
    monto_combustible: z.coerce.number().min(0).default(0),
    comentarios: z.array(bitacoraComentarioInputSchema).default([]),
  })
  .refine((data) => data.km_final >= data.km_inicial, {
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
  comentarios: BitacoraComentariosJsonb;
  created_at: string;

  ter_vehiculos?: {
    placa: string;
    marca: string;
    modelo: string;
  };
  profiles?: {
    nombre: string;
  };
};
