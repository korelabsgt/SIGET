import { z } from "zod";
import {
  AGENCIAS,
  CRITICIDADES,
  DERIVACIONES,
  ESTADOS_ACUERDO,
  ETIQUETAS_SEGURIDAD,
  FASES_DIALOGO,
  INSTITUCIONES_RESPONSABLES,
  MICROCUENCAS,
  MUNICIPIOS,
  ROLES_JA,
  TIPOLOGIAS,
  TIPOLOGIAS_PROYECTO,
} from "./catalogos";

export const fechaCalendarioSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const fotosRegistroSchema = z.array(z.string().trim().min(1)).max(5).default([]);

const poblacionSchema = z.object({
  hombres: z.number().int().min(0, "Debe ser 0 o más"),
  mujeres: z.number().int().min(0, "Debe ser 0 o más"),
  juventudes: z.number().int().min(0, "Debe ser 0 o más"),
  pueblo_maya_chorti: z.number().int().min(0, "Debe ser 0 o más"),
});

export const incidenteFormSchema = z
  .object({
    fecha: fechaCalendarioSchema,
    microcuenca: z.enum(MICROCUENCAS),
    municipio: z.enum(MUNICIPIOS),
    criticidad: z.enum(CRITICIDADES),
    tipologia: z.enum(TIPOLOGIAS),
    descripcion: z.string().trim().min(12, "Describe la tensión hídrica con al menos 12 caracteres"),
    poblacion: poblacionSchema,
    confidencial: z.boolean(),
    derivacion: z.enum(DERIVACIONES),
    asignado_usuario_id: z.string().uuid("Selecciona una unidad institucional"),
    asignado_a: z.string().trim().min(2, "Indica a quién se deriva"),
    fotos: fotosRegistroSchema,
  })
  .refine(
    (v) =>
      v.poblacion.hombres +
        v.poblacion.mujeres +
        v.poblacion.juventudes +
        v.poblacion.pueblo_maya_chorti >
      0,
    { message: "Registra al menos una persona afectada", path: ["poblacion"] },
  );

export type IncidenteFormValues = z.infer<typeof incidenteFormSchema>;

export type IncidenteRecord = Omit<IncidenteFormValues, "asignado_usuario_id"> & {
  asignado_usuario_id: string | null;
  id: string;
  folio: string;
  id_anonimo: string | null;
  created_at: string;
  updated_at: string | null;
};

export const sesionFormSchema = z.object({
  titulo: z.string().trim().min(4, "El título es obligatorio"),
  fecha: fechaCalendarioSchema,
  microcuenca: z.enum(MICROCUENCAS),
  municipio: z.enum(MUNICIPIOS),
  fase: z.enum(FASES_DIALOGO),
  incidente_id: z.string().trim().min(1, "Vincula un incidente"),
  notas: z.string().trim().max(800).optional().default(""),
  fotos: fotosRegistroSchema,
});

export type SesionFormValues = z.infer<typeof sesionFormSchema>;

export type SesionRecord = SesionFormValues & {
  id: string;
  created_at: string;
  updated_at: string | null;
};

export const acuerdoFormSchema = z.object({
  sesion_id: z.string().trim().min(1, "Vincula una sesión"),
  incidente_id: z.string().trim().min(1, "Vincula un incidente"),
  descripcion: z.string().trim().min(8, "Describe el compromiso"),
  institucion_responsable: z.enum(INSTITUCIONES_RESPONSABLES),
  fecha_limite: fechaCalendarioSchema,
  estado: z.enum(ESTADOS_ACUERDO),
  efectividad: z.number().int().min(1).max(5),
  medio_verificacion: z.string().trim().min(3, "Indica el medio de verificación"),
  fotos: fotosRegistroSchema,
});

export type AcuerdoFormValues = z.infer<typeof acuerdoFormSchema>;

export type AcuerdoRecord = AcuerdoFormValues & {
  id: string;
  created_at: string;
  updated_at: string | null;
};

export const proyectoFormSchema = z.object({
  nombre: z.string().trim().min(4, "El nombre es obligatorio"),
  comunidad: z.string().trim().min(2, "La comunidad es obligatoria"),
  microcuenca: z.enum(MICROCUENCAS),
  municipio: z.enum(MUNICIPIOS),
  agencia: z.enum(AGENCIAS),
  tipologia: z.enum(TIPOLOGIAS_PROYECTO),
  avance_fisico: z.number().min(0).max(100),
  presupuesto_total: z.number().min(0),
  presupuesto_ejecutado: z.number().min(0),
  representatividad_comunitaria: z.number().min(0).max(100),
  impacto_medios_vida: z.number().int().min(1).max(5),
  innovacion_climatica: z.number().int().min(1).max(5),
  fotos: fotosRegistroSchema,
});

export type ProyectoFormValues = z.infer<typeof proyectoFormSchema>;

export type ProyectoRecord = ProyectoFormValues & {
  id: string;
  created_at: string;
  updated_at: string | null;
};

export type MetodologiaRecord = {
  id: string;
  titulo: string;
  tipo: "Guía" | "Protocolo de mediación" | "Estudio de caso";
  pertinencia: string;
  microcuenca: (typeof MICROCUENCAS)[number] | null;
  resumen: string;
  fotos: string[];
};

export type OrganizacionAliadaRecord = {
  id: string;
  nombre: string;
  tipo: string;
  municipio: (typeof MUNICIPIOS)[number];
  contacto: string;
  descripcion: string;
  mujeres_liderazgo: number;
  juventudes_liderazgo: number;
  fotos: string[];
};

export type EvidenciaRecord = {
  id: string;
  titulo: string;
  tipo: string;
  etiqueta: (typeof ETIQUETAS_SEGURIDAD)[number];
  fecha: string;
  vinculado: string;
  fotos: string[];
};

export type RolJaPersistido = (typeof ROLES_JA)[number];

export const procesoFormSchema = z.object({
  microcuenca: z.enum(MICROCUENCAS),
  titulo: z.string().trim().min(4, "El título es obligatorio"),
  resumen: z
    .string()
    .trim()
    .min(12, "Describe qué sucedió, cómo se resolvió o qué se hizo"),
  fecha: fechaCalendarioSchema,
  nombre_archivo: z.string().trim().min(1, "Adjunta un PDF"),
  pdf_data: z.string().trim().min(20, "Adjunta un PDF"),
});

export type ProcesoFormValues = z.infer<typeof procesoFormSchema>;

export type ProcesoRecord = ProcesoFormValues & {
  id: string;
  created_at: string;
};

export type JaStoreState = {
  incidentes: IncidenteRecord[];
  sesiones: SesionRecord[];
  acuerdos: AcuerdoRecord[];
  proyectos: ProyectoRecord[];
  metodologias: MetodologiaRecord[];
  organizaciones: OrganizacionAliadaRecord[];
  evidencias: EvidenciaRecord[];
  procesos: ProcesoRecord[];
};

export const reporteCiudadanoFormSchema = z
  .object({
    tipologia: z.enum(TIPOLOGIAS),
    microcuenca: z.enum(MICROCUENCAS),
    municipio: z.enum(MUNICIPIOS),
    comunidad: z.string().trim().min(2, "Indica la comunidad o caserío"),
    descripcion: z
      .string()
      .trim()
      .min(12, "Describe la situación con al menos 12 caracteres"),
    poblacion: poblacionSchema,
    confidencial: z.boolean(),
    nombre: z.string().trim().max(80).optional().default(""),
    contacto: z.string().trim().max(80).optional().default(""),
  })
  .refine(
    (v) =>
      v.poblacion.hombres +
        v.poblacion.mujeres +
        v.poblacion.juventudes +
        v.poblacion.pueblo_maya_chorti >
      0,
    { message: "Registra al menos una persona o familia afectada", path: ["poblacion"] },
  )
  .superRefine((v, ctx) => {
    if (v.confidencial) return;
    if (v.nombre.trim().length < 3) {
      ctx.addIssue({
        code: "custom",
        message: "Indica un nombre de contacto o activa el reporte confidencial",
        path: ["nombre"],
      });
    }
  });

export type ReporteCiudadanoFormValues = z.infer<typeof reporteCiudadanoFormSchema>;

export type ActionResult = { success: boolean; error: string | null };

export type ActionResultConCodigo = ActionResult & { codigo: string | null };
