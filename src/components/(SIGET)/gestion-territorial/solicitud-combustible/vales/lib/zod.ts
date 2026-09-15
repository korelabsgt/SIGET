import { z } from "zod";

export const FONDOS_COMBUSTIBLE = ["OT", "HAME"] as const;

export type FondoCombustible = (typeof FONDOS_COMBUSTIBLE)[number];

const valeLoteFormBaseSchema = z
  .object({
    denominacion: z.coerce.number().positive("La denominación debe ser mayor a cero"),
    cupon_del: z.coerce.number().int().min(1, "Numeración inicial inválida"),
    cupon_al: z.coerce.number().int().min(1, "Numeración final inválida"),
    fondo: z.enum(FONDOS_COMBUSTIBLE),
  })
  .refine((data) => data.cupon_al >= data.cupon_del, {
    message: "El cupón final debe ser mayor o igual al inicial",
    path: ["cupon_al"],
  });

export type ValeLoteFormValues = z.input<typeof valeLoteFormBaseSchema>;

export const valeLoteInputSchema = valeLoteFormBaseSchema.transform((data) => ({
  ...data,
  cantidad: data.cupon_al - data.cupon_del + 1,
}));

export type ValeLoteInput = z.output<typeof valeLoteInputSchema>;

export type ValeLoteRow = {
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
