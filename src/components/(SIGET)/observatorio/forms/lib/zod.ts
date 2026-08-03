import { z } from "zod";

export const obsSectorSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
});

export const obsOrganizacionSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  logo: z.string().nullable().optional(),
});

export const obsPoliticaSchema = z.object({
  id: z.string().uuid(),
  sector_id: z.string().uuid(),
  codigo: z.string(),
  descripcion: z.string(),
  activo: z.boolean(),
  obs_sectores: z.object({ nombre: z.string() }).optional(),
});

export const obsCampoSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  activo: z.boolean(),
  orden: z.number().nullable().optional(),
});

export const obsPredefinedFieldSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  orden: z.number(),
});

export const obsIndicadorCampoSchema = z.object({
  id: z.string().uuid(),
  indicador_id: z.string().uuid(),
  campo_id: z.string().uuid(),
  orden: z.string(),
  activo: z.boolean(),
  obs_campos: obsCampoSchema.optional(),
});

export const obsIndicadorSchema = z.object({
  id: z.string().uuid(),
  politica_id: z.string().uuid(),
  nombre: z.string(),
  activo: z.boolean(),
  obs_politicas: obsPoliticaSchema.optional(),
  obs_indicador_campos: z.array(obsIndicadorCampoSchema).optional(),
});

export const obsNacionalidadSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
});

export const obsPerfilSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
});

export type ObsSector = z.infer<typeof obsSectorSchema>;
export type ObsOrganizacion = z.infer<typeof obsOrganizacionSchema>;
export type ObsPolitica = z.infer<typeof obsPoliticaSchema>;
export type ObsCampo = z.infer<typeof obsCampoSchema>;
export type ObsPredefinedField = z.infer<typeof obsPredefinedFieldSchema>;
export type ObsIndicadorCampo = z.infer<typeof obsIndicadorCampoSchema>;
export type ObsIndicador = z.infer<typeof obsIndicadorSchema>;
export type ObsNacionalidad = z.infer<typeof obsNacionalidadSchema>;
export type ObsPerfil = z.infer<typeof obsPerfilSchema>;

export const formValorSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  persisted: z.boolean().optional(),
  indicadorCampoId: z.string().optional(),
  campoId: z.string().optional(),
});

export const formIndicadorSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  valores: z.array(formValorSchema),
  persisted: z.boolean().optional(),
});

export const registroEntradaSchema = z.object({
  id: z.string(),
  indicadorId: z.string(),
  nacionalidadId: z.string(),
  perfilId: z.string(),
  valores: z.record(z.string(), z.string()),
});

export type FormValor = z.infer<typeof formValorSchema>;
export type FormIndicador = z.infer<typeof formIndicadorSchema>;
export type RegistroEntrada = z.infer<typeof registroEntradaSchema>;

export const constructorInitialDataSchema = z.object({
  sectorId: z.string().optional(),
  politica: obsPoliticaSchema.nullable().optional(),
});

export type ConstructorInitialData = z.infer<typeof constructorInitialDataSchema>;

export const nombreInputSchema = z
  .string()
  .trim()
  .min(1, "El nombre no puede estar vacío");

export const createSectorInputSchema = z.object({
  nombre: nombreInputSchema,
});

export const createOrganizacionInputSchema = z.object({
  nombre: nombreInputSchema,
});

export const updateOrganizacionNombreInputSchema = z.object({
  organizacionId: z.string().uuid(),
  nombre: nombreInputSchema,
});

export const orgSectorIdsInputSchema = z.object({
  organizacionId: z.string().uuid(),
  sectorId: z.string().uuid(),
});

export const createPoliticaInputSchema = z.object({
  sectorId: z.string().uuid(),
  codigo: z.string().trim().min(1),
  descripcion: z.string().trim().min(1),
});

export const createPoliticaConIndicadoresInputSchema = createPoliticaInputSchema.extend({
  gruposIndicadores: z.array(formIndicadorSchema).min(1),
  politicaId: z.string().uuid().nullable().optional(),
});

export const createPredefinedFieldInputSchema = z.object({
  nombre: nombreInputSchema,
  orden: z.number().int().min(1),
});

export const updatePredefinedFieldInputSchema = createPredefinedFieldInputSchema.extend({
  id: z.string().uuid(),
});

export const createRegistroInputSchema = z.object({
  organizacionId: z.string().uuid(),
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2000),
  registros: z.array(registroEntradaSchema).min(1),
});

export const deleteRegistroInputSchema = z.object({
  registroId: z.string().uuid(),
});

export const registroHistoricoValorSchema = z.object({
  id: z.string().uuid(),
  cantidad: z.number(),
  campoNombre: z.string(),
  campoOrden: z.number(),
  indicadorNombre: z.string(),
  politicaId: z.string().uuid().nullable(),
  politicaCodigo: z.string(),
  politicaDescripcion: z.string(),
  sectorId: z.string().uuid().nullable(),
  sectorNombre: z.string(),
  nacionalidadNombre: z.string().nullable(),
  perfilNombre: z.string().nullable(),
});

export const registroHistoricoPoliticaSchema = z.object({
  codigo: z.string(),
  descripcion: z.string(),
});

export const registroHistoricoSchema = z.object({
  id: z.string().uuid(),
  mes: z.number(),
  anio: z.number(),
  createdAt: z.string(),
  createdById: z.string().uuid().nullable(),
  creadorNombre: z.string().nullable(),
  creadorEmail: z.string().nullable(),
  organizacionId: z.string().uuid().nullable(),
  organizacionNombre: z.string(),
  totalAtenciones: z.number(),
  totalValores: z.number(),
  politicas: z.array(registroHistoricoPoliticaSchema),
  valores: z.array(registroHistoricoValorSchema),
});

export type RegistroHistoricoValor = z.infer<typeof registroHistoricoValorSchema>;
export type RegistroHistoricoPolitica = z.infer<typeof registroHistoricoPoliticaSchema>;
export type RegistroHistorico = z.infer<typeof registroHistoricoSchema>;

export const orgWithSectorsSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  logo: z.string().nullable(),
  sectores: z.array(obsSectorSchema),
});

export type OrgWithSectors = z.infer<typeof orgWithSectorsSchema>;

export type OrgSectorLinkRow = {
  organizacion_id: string;
  obs_organizaciones: ObsOrganizacion | ObsOrganizacion[] | null;
};

export type OrgSectorLinkWithSector = {
  organizacion_id: string;
  sector_id: string;
  obs_sectores: { id: string; nombre: string } | { id: string; nombre: string }[] | null;
};

export type ProfileCreatorRow = {
  id: string;
  nombre: string | null;
  email: string | null;
};

export type RegistroHistoricoQueryRow = {
  id: string;
  mes: number;
  anio: number;
  created_at: string;
  created_by: string | null;
  organizacion_id: string | null;
  obs_organizaciones: { nombre: string } | { nombre: string }[] | null;
  obs_registros_valores: RegistroHistoricoValorQueryRow[];
};

export type RegistroHistoricoValorQueryRow = {
  id: string;
  cantidad: number | null;
  nacionalidad_id: string | null;
  perfil_id: string | null;
  obs_indicador_campos:
    | RegistroIndicadorCampoQueryRow
    | RegistroIndicadorCampoQueryRow[]
    | null;
};

export type RegistroIndicadorCampoQueryRow = {
  orden: string | null;
  obs_campos: { nombre: string } | { nombre: string }[] | null;
  obs_indicadores:
    | {
        nombre: string;
        obs_politicas:
          | {
              id: string;
              codigo: string;
              descripcion: string;
              sector_id: string;
              obs_sectores: { nombre: string } | { nombre: string }[] | null;
            }
          | {
              id: string;
              codigo: string;
              descripcion: string;
              sector_id: string;
              obs_sectores: { nombre: string } | { nombre: string }[] | null;
            }[]
          | null;
      }
    | {
        nombre: string;
        obs_politicas:
          | {
              id: string;
              codigo: string;
              descripcion: string;
              sector_id: string;
              obs_sectores: { nombre: string } | { nombre: string }[] | null;
            }
          | {
              id: string;
              codigo: string;
              descripcion: string;
              sector_id: string;
              obs_sectores: { nombre: string } | { nombre: string }[] | null;
            }[]
          | null;
      }[]
    | null;
};

export function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
