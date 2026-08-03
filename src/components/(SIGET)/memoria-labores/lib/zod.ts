import { z } from "zod";

export const TITULO_INFORME_MEMORIA = "Informe de Memoria de Labores";

export const TITULO_MEMORIA = TITULO_INFORME_MEMORIA;

export const beneficiariosGrupoSchema = z.object({
  hombres: z.coerce.number().int("Debe ser un entero").min(0, "No puede ser negativo"),
  mujeres: z.coerce.number().int("Debe ser un entero").min(0, "No puede ser negativo"),
  jovenes: z.coerce.number().int("Debe ser un entero").min(0, "No puede ser negativo"),
});

export const beneficiariosSchema = z.object({
  directos: beneficiariosGrupoSchema,
  indirectos: beneficiariosGrupoSchema,
});

const listaTexto = z
  .array(z.string())
  .transform((arr) => arr.map((s) => s.trim()).filter(Boolean));

export const proyectoAvanceSchema = z
  .object({
    descripcion: z.string().trim(),
    logrado: z.coerce.number().int().min(0, "No puede ser negativo"),
    meta: z.coerce
      .number()
      .int()
      .min(1, "Indique la meta total (el número que usted defina, no tiene que ser 10)"),
  })
  .refine((a) => a.logrado <= a.meta, {
    message: "El logrado no puede superar la meta",
    path: ["logrado"],
  });

const listaAvances = z
  .array(proyectoAvanceSchema)
  .transform((arr) =>
    arr.filter((a) => a.descripcion.length > 0 || a.logrado > 0),
  );

export const proyectoItemSchema = z.object({
  nombre: z.string().trim().min(1, "Indique el nombre del proyecto"),
  mes: z.string().regex(/^\d{4}-\d{2}$/, "Seleccione el mes del proyecto"),
  descripcion: z.string().trim(),
  beneficiarios: beneficiariosSchema,
  avances: listaAvances,
  resultados: listaTexto,
  efectos: listaTexto,
});

const proyectoTieneContenido = (
  p: z.infer<typeof proyectoItemSchema>,
  imagenesProyecto: string[] = [],
) =>
  p.nombre.length > 0 ||
  p.descripcion.length > 0 ||
  p.avances.length > 0 ||
  p.resultados.length > 0 ||
  p.efectos.length > 0 ||
  imagenesProyecto.length > 0;

export const proyectosMemoriaSchema = z
  .object({
    proyectos: z.array(proyectoItemSchema),
    imagenes: z
      .array(z.array(z.string()).max(4))
      .optional()
      .default([]),
  })
  .transform((data) => {
    const pares = data.proyectos.map((proyecto, index) => ({
      proyecto,
      imagenes: data.imagenes[index] ?? [],
    }));
    const filtrados = pares.filter(({ proyecto, imagenes }) =>
      proyectoTieneContenido(proyecto, imagenes),
    );
    return {
      proyectos: filtrados.map(({ proyecto }) => proyecto),
      imagenes: filtrados.map(({ imagenes }) => imagenes),
    };
  });

export type ProyectosMemoriaInput = z.infer<typeof proyectosMemoriaSchema>;
export type ProyectoAvance = z.infer<typeof proyectoAvanceSchema>;
export type ProyectoItem = z.infer<typeof proyectoItemSchema>;
export type Beneficiarios = z.infer<typeof beneficiariosSchema>;
export type BeneficiariosGrupo = z.infer<typeof beneficiariosGrupoSchema>;

export const autofillInformeUsuarioSchema = z.object({
  cargo: z.string(),
  oficina: z.string(),
  nombre: z.string(),
});

export const proyectosMemoriaRowSchema = z.object({
  id: z.string().uuid(),
  periodo: z.string(),
  proyectos: z.array(proyectoItemSchema),
  beneficiarios: beneficiariosSchema,
  imagenes: z.array(z.array(z.string())),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  nombre: z.string().nullable(),
  cargo: z.string().nullable(),
  oficina: z.string().nullable(),
});

export const filtroPeriodoMemoriaSchema = z.object({
  anio: z.number().int(),
  mes: z.number().int().min(1).max(12).nullable(),
});

export type AutofillInformeUsuario = z.infer<typeof autofillInformeUsuarioSchema>;
export type ProyectosMemoria = z.infer<typeof proyectosMemoriaRowSchema>;
export type FiltroPeriodoMemoria = z.infer<typeof filtroPeriodoMemoriaSchema>;

export type FechaInformeParts = {
  dia: string;
  fecha: string;
  hora: string;
};
