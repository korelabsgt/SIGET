import { z } from "zod";

export const GENEROS = ["masculino", "femenino"] as const;
export type Genero = (typeof GENEROS)[number];

export const INSTITUCION_PLAN_TRIFINIO = "Plan Trifinio";
export const INSTITUCION_SIN = "Sin Institución";

export const ACT_TABLAS = {
  actividades: "act_actividades",
  registros: "act_registros",
  minutas: "act_minutas",
  responsables: "act_minuta_responsables",
} as const;

export const TIPOS_INSTITUCION = ["sin", "plan_trifinio", "otras"] as const;
export type TipoInstitucion = (typeof TIPOS_INSTITUCION)[number];

export function resolverInstitucion(data: {
  tipo_institucion?: TipoInstitucion;
  institucion_otra?: string;
}): string {
  if (data.tipo_institucion === "plan_trifinio") return INSTITUCION_PLAN_TRIFINIO;
  if (data.tipo_institucion === "otras") {
    return data.institucion_otra?.trim() || INSTITUCION_SIN;
  }
  return INSTITUCION_SIN;
}

export function esTrifinioDesdeTipo(tipo?: TipoInstitucion): boolean {
  return tipo === "plan_trifinio";
}

export function institucionDesdeRegistro(
  institucion: string | null,
): { tipo: TipoInstitucion; otra: string } {
  if (!institucion || institucion === INSTITUCION_SIN) {
    return { tipo: "sin", otra: "" };
  }
  if (institucion === INSTITUCION_PLAN_TRIFINIO) {
    return { tipo: "plan_trifinio", otra: "" };
  }
  return { tipo: "otras", otra: institucion };
}

const dpiSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().length(13, "El DPI debe tener 13 dígitos"));

export const actividadFormSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  descripcion: z.string().trim().max(500).optional().default(""),
  fecha_realizacion: z.string().min(1, "La fecha de la actividad es obligatoria"),
  direccion: z.string().trim().min(1, "La dirección es obligatoria"),
  departamento: z.string().trim().min(1, "Seleccione un departamento"),
  municipio: z.string().trim().min(1, "Seleccione un municipio"),
  activo: z.boolean().default(true),
});

export type ActividadFormValues = z.infer<typeof actividadFormSchema>;

export const participanteCamposSchema = z.object({
  dpi: dpiSchema,
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  fecha_nacimiento: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  genero: z.enum(GENEROS, { message: "Seleccione un género" }),
  email: z
    .string()
    .trim()
    .max(200)
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Correo electrónico inválido",
    )
    .optional()
    .default(""),
  telefono: z
    .string()
    .trim()
    .transform((v) => normalizarTelefonoInput(v))
    .refine((v) => v === "" || v.length === 8, "El teléfono debe tener 8 dígitos")
    .optional()
    .default(""),
  tipo_institucion: z.enum(TIPOS_INSTITUCION).optional().default("sin"),
  institucion_otra: z.string().trim().optional().default(""),
  puesto: z.string().trim().optional().default(""),
});

const registroCamposRefine = (
  data: {
    tipo_institucion?: TipoInstitucion;
    institucion_otra?: string;
  },
  ctx: z.RefinementCtx,
) => {
  if (data.tipo_institucion === "otras" && !data.institucion_otra?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Indique el nombre de la institución",
      path: ["institucion_otra"],
    });
  }
};

export const registroPublicoSchema = participanteCamposSchema
  .extend({
    actividad_id: z.string().uuid("Actividad inválida"),
  })
  .superRefine(registroCamposRefine);

export type RegistroPublicoValues = z.infer<typeof registroPublicoSchema>;

export const registroEditSchema = participanteCamposSchema
  .extend({
    id: z.string().uuid(),
    actividad_id: z.string().uuid(),
  })
  .superRefine(registroCamposRefine);

export type RegistroEditValues = z.infer<typeof registroEditSchema>;

export type ActividadRecord = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  fecha_realizacion: string;
  direccion: string;
  departamento: string;
  municipio: string;
  activo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  total_registros?: number;
  creador_nombre: string | null;
  creador_oficina: string | null;
};

export type ParticipanteRecord = {
  dpi: string;
  nombre: string;
  fecha_nacimiento: string;
  genero: Genero;
  email: string | null;
  telefono: string | null;
  es_trifinio: boolean;
  institucion: string | null;
  puesto: string | null;
  direccion_administrativa: string | null;
  created_at: string;
  updated_at: string | null;
};

export type RegistroAsistenciaRecord = {
  id: string;
  actividad_id: string;
  dpi: string;
  nombre: string;
  puesto: string | null;
  direccion_administrativa: string | null;
  fecha_nacimiento: string;
  genero: Genero;
  email: string | null;
  telefono: string | null;
  es_trifinio: boolean;
  institucion: string | null;
  created_at: string;
};

export function normalizarDpiInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 13);
}

export function normalizarTelefonoInput(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("502") && digits.length > 8) {
    digits = digits.slice(3);
  }
  return digits.slice(0, 8);
}

export function telefonoLocalDigitos(telefono: string | null): string {
  if (!telefono?.trim()) return "";
  return normalizarTelefonoInput(telefono);
}

export function telefonoWhatsAppUrl(telefono: string | null): string | null {
  const local = telefonoLocalDigitos(telefono);
  if (local.length !== 8) return null;
  return `https://wa.me/502${local}`;
}

export function formatoTelefonoVisible(telefono: string | null): string {
  const local = telefonoLocalDigitos(telefono);
  if (local.length !== 8) return telefono?.trim() ?? "";
  return `${local.slice(0, 4)}-${local.slice(4)}`;
}

export function formatoTelefonoGt(telefono: string | null): string {
  return formatoTelefonoVisible(telefono);
}

export function formatoDpiVisible(dpi: string | null | undefined): string {
  const digits = dpi?.replace(/\D/g, "") ?? "";
  if (digits.length !== 13) return digits || dpi?.trim() || "";
  return `${digits.slice(0, 4)} ${digits.slice(4, -4)} ${digits.slice(-4)}`;
}

export function normalizarFechaInput(value: string): string {
  if (!value) return "";
  return value.split("T")[0];
}

export function partesFechaCalendario(value: string): {
  dia: string;
  mes: string;
  anio: string;
} {
  const norm = normalizarFechaInput(value);
  if (!norm) return { dia: "", mes: "", anio: "" };
  const [anio, mes, dia] = norm.split("-");
  return {
    dia: dia?.replace(/^0+(?=\d)/, "") ?? "",
    mes: mes?.replace(/^0+(?=\d)/, "") ?? "",
    anio: anio ?? "",
  };
}

export function normalizarParteFechaDia(value: string): string {
  return value.replace(/\D/g, "").slice(0, 2);
}

export function normalizarParteFechaMes(value: string): string {
  return value.replace(/\D/g, "").slice(0, 2);
}

export function normalizarParteFechaAnio(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function fechaCalendarioDesdePartes(
  dia: string,
  mes: string,
  anio: string,
): string {
  const d = dia.replace(/\D/g, "");
  const m = mes.replace(/\D/g, "");
  const y = anio.replace(/\D/g, "");
  if (d.length === 0 || m.length === 0 || y.length !== 4) return "";
  const dd = d.padStart(2, "0");
  const mm = m.padStart(2, "0");
  if (!/^\d{2}$/.test(dd) || !/^\d{2}$/.test(mm) || !/^\d{4}$/.test(y)) {
    return "";
  }
  return `${y}-${mm}-${dd}`;
}

export function formatUbicacionActividad(actividad: {
  direccion: string;
  departamento: string;
  municipio: string;
}): string {
  const partes = [
    actividad.direccion?.trim(),
    [actividad.municipio, actividad.departamento].filter(Boolean).join(", "),
  ].filter(Boolean);
  return partes.join(" · ");
}

export const MINUTA_MENCION_TIPOS = [
  "usuario",
  "departamento",
  "puesto",
] as const;

export const MINUTA_ANEXO_TIPOS = ["imagen", "pdf", "enlace"] as const;

export const MINUTA_ESTADOS = ["borrador", "finalizada"] as const;

export const minutaMencionSchema = z.object({
  tipo: z.enum(MINUTA_MENCION_TIPOS),
  id: z.string().uuid("Referencia de mención inválida"),
  nombre: z.string().trim().min(1, "La mención necesita nombre"),
});

export const minutaAnexoSchema = z
  .object({
    id: z.string().trim().min(1),
    tipo: z.enum(MINUTA_ANEXO_TIPOS),
    titulo: z.string().trim().max(300).default(""),
    url: z.string().trim().url("El anexo necesita una URL válida"),
    bucket: z.string().trim().nullable().default(null),
    path: z.string().trim().nullable().default(null),
    nombreArchivo: z.string().trim().nullable().default(null),
    mime: z.string().trim().nullable().default(null),
    tamano: z.number().int().nonnegative().nullable().default(null),
  })
  .superRefine((anexo, ctx) => {
    if (anexo.tipo === "enlace") return;
    if (!anexo.path) {
      ctx.addIssue({
        code: "custom",
        path: ["path"],
        message: "Los archivos requieren la ruta de Storage",
      });
    }
  });

export const minutaActividadBloqueSchema = z.object({
  id: z.string().trim().min(1),
  titulo: z.string().max(500).default(""),
  items: z.array(z.string().max(20000)).default([]),
});

export const minutaAcuerdoSchema = z.object({
  id: z.string().trim().min(1),
  titulo: z.string().max(20000).default(""),
  responsablesTexto: z.string().max(20000).default(""),
  responsables: z.array(minutaMencionSchema).default([]),
  items: z.array(z.string().max(20000)).default([]),
});

export const minutaGuardarSchema = z.object({
  actividadId: z.string().uuid("Actividad inválida"),
  institucion: z.string().trim().max(300).default(""),
  elaboro: z.string().trim().max(300).default(""),
  estado: z.enum(MINUTA_ESTADOS).default("borrador"),
  introduccion: z.string().max(100000).default(""),
  actividadesRealizadas: z.array(minutaActividadBloqueSchema).default([]),
  acuerdos: z.array(minutaAcuerdoSchema).default([]),
  compromisosGenerales: z.string().max(100000).default(""),
  anexosNota: z.string().max(100000).default(""),
  anexos: z.array(minutaAnexoSchema).default([]),
});

export type MinutaMencionValues = z.infer<typeof minutaMencionSchema>;
export type MinutaAnexoValues = z.infer<typeof minutaAnexoSchema>;
export type MinutaGuardarValues = z.infer<typeof minutaGuardarSchema>;

export function formatFechaActividad(fecha: string): string {
  try {
    const [y, m, d] = normalizarFechaInput(fecha).split("-").map(Number);
    if (!y || !m || !d) return fecha;
    return new Date(y, m - 1, d).toLocaleDateString("es-GT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return fecha;
  }
}
