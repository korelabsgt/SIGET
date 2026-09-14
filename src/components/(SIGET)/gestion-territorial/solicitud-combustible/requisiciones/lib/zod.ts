import { z } from "zod";

export const FONDOS_COMBUSTIBLE = ["OT", "HAME"] as const;

export type FondoCombustible = (typeof FONDOS_COMBUSTIBLE)[number];

export const requisicionInputSchema = z
  .object({
    cantidad: z.coerce.number().int().min(1, "Indique al menos un cupón"),
    denominacion: z.coerce.number().positive("La denominación debe ser mayor a cero"),
    cupon_del: z.coerce.number().int().min(1, "Numeración inicial inválida"),
    cupon_al: z.coerce.number().int().min(1, "Numeración final inválida"),
    fondo: z.enum(FONDOS_COMBUSTIBLE),
  })
  .refine((data) => data.cupon_al >= data.cupon_del, {
    message: "El cupón final debe ser mayor o igual al inicial",
    path: ["cupon_al"],
  })
  .refine((data) => data.cantidad === data.cupon_al - data.cupon_del + 1, {
    message: "La cantidad debe coincidir con el rango de numeración",
    path: ["cantidad"],
  });

export type RequisicionInput = z.infer<typeof requisicionInputSchema>;

export type RequisicionRow = {
  id: string;
  cantidad: number;
  denominacion: number;
  cupon_del: number;
  cupon_al: number;
  disponibles: number;
  ultimo_entregado: number | null;
  fondo: FondoCombustible;
  created_at: string;
};
