"use server";

import { createClient } from "@/utils/supabase/server";
import { createPublicClient } from "@/utils/supabase/public";
import {
  actividadFormSchema,
  registroPublicoSchema,
  registroEditSchema,
  minutaGuardarSchema,
  ACT_TABLAS,
  type ActividadFormValues,
  type ActividadRecord,
  type ParticipanteRecord,
  type RegistroAsistenciaRecord,
  type RegistroPublicoValues,
  type RegistroEditValues,
  type MinutaGuardarValues,
  type MinutaMencionValues,
  resolverInstitucion,
  esTrifinioDesdeTipo,
} from "./zod";
import {
  crearActividadBloqueVacio,
  crearMinutaVacia,
  extraerMenciones,
  MINUTA_ANEXOS_BUCKET,
  type MinutaAcuerdo,
  type MinutaActividadBloque,
  type MinutaAnexo,
  type MinutaMencionTipo,
  type MinutaRecord,
} from "./minuta";
import {
  canEliminarActividadAsistencia,
  esUuidActividad,
  isPrivilegedAsistenciaRole,
  slugifyNombreActividad,
} from "./helpers";

type ActionResult = {
  success: boolean;
  error: string | null;
  detail?: string | null;
};

export type DpiSugerencia = {
  dpi: string;
  nombre: string;
};
type ActionResultWithId = ActionResult & { id?: string; slug?: string };

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ProfileRow = {
  id: string;
  nombre: string | null;
  puesto_id: string | null;
};

type CreadorActividad = {
  nombre: string;
  oficina: string;
};

const RAIZ_PLAN_TRIFINIO = "Plan Trifinio";
const SEPARADOR_JERARQUIA = " · ";

function roleFromUser(user: { user_metadata?: { rol?: string }; role?: string }) {
  return (
    (user.user_metadata?.rol as string | undefined) || user.role || "user"
  );
}

function prefijarRaizOrganizacion(ruta: string): string {
  const limpia = ruta.trim();
  if (!limpia) return RAIZ_PLAN_TRIFINIO;
  if (limpia.startsWith(RAIZ_PLAN_TRIFINIO)) return limpia;
  return `${RAIZ_PLAN_TRIFINIO}${SEPARADOR_JERARQUIA}${limpia}`;
}

async function rutaDepartamentoIterativa(
  supabase: SupabaseServerClient,
  departamentoId: string,
): Promise<string> {
  const partes: string[] = [];
  let actualId: string | null = departamentoId;
  const visitados = new Set<string>();

  while (actualId && !visitados.has(actualId)) {
    visitados.add(actualId);
    const { data } = await supabase
      .from("departamentos")
      .select("nombre, parent_id")
      .eq("id", actualId)
      .maybeSingle();
    const dep = data as { nombre: string | null; parent_id: string | null } | null;
    if (!dep) break;
    partes.unshift(String(dep.nombre ?? ""));
    actualId = (dep.parent_id as string | null) ?? null;
  }

  return partes.join(SEPARADOR_JERARQUIA);
}

async function oficinaDesdePuesto(
  supabase: SupabaseServerClient,
  puestoId: string,
  departamentoId: string | null,
): Promise<string> {
  const { data: jefaturas } = await supabase
    .from("puesto_jefaturas")
    .select("departamento_id")
    .eq("puesto_id", puestoId);

  const jefaturaIds = (jefaturas ?? []).map((row) =>
    String(row.departamento_id),
  );

  let ruta = "";
  if (jefaturaIds.length > 0) {
    const rutas = await Promise.all(
      jefaturaIds.map((id) => rutaDepartamentoIterativa(supabase, id)),
    );
    const unicas = [...new Set(rutas.filter(Boolean))];
    if (unicas.length > 0) ruta = unicas.join(" · ");
  } else if (departamentoId) {
    ruta = await rutaDepartamentoIterativa(supabase, departamentoId);
  }

  return prefijarRaizOrganizacion(ruta);
}

async function creadorDesdeProfile(
  supabase: SupabaseServerClient,
  profile: ProfileRow,
): Promise<CreadorActividad> {
  const nombre = String(profile.nombre ?? "").trim();
  const puestoId = profile.puesto_id;

  if (!puestoId) {
    return { nombre, oficina: "" };
  }

  const { data: puesto } = await supabase
    .from("puestos")
    .select("nombre, departamento_id")
    .eq("id", puestoId)
    .maybeSingle();

  const departamentoId = (puesto?.departamento_id as string | null) ?? null;
  const oficina = await oficinaDesdePuesto(supabase, puestoId, departamentoId);

  return { nombre, oficina };
}

async function resolveCreadores(
  supabase: SupabaseServerClient,
  createdByIds: Array<string | null | undefined>,
): Promise<Map<string, CreadorActividad>> {
  const profileIds = [
    ...new Set(createdByIds.filter((id): id is string => Boolean(id))),
  ];

  if (profileIds.length === 0) return new Map();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, nombre, puesto_id")
    .in("id", profileIds);

  if (error || !profiles) return new Map();

  const entries = await Promise.all(
    profiles.map(async (profile) => {
      const creador = await creadorDesdeProfile(
        supabase,
        profile as ProfileRow,
      );
      return [profile.id, creador] as const;
    }),
  );

  return new Map(entries);
}

function mapDbError(error: { code?: string; message?: string }): ActionResult {
  if (error.code === "23505") {
    return {
      success: false,
      error: "DUPLICATE",
      detail: error.message ?? null,
    };
  }
  if (error.code === "42501") {
    return {
      success: false,
      error: "FORBIDDEN",
      detail: error.message ?? "Sin permiso para esta operación.",
    };
  }
  return {
    success: false,
    error: "DB_ERROR",
    detail: error.message ?? "Error desconocido en la base de datos.",
  };
}

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, user: null, error: "UNAUTHORIZED" as const };
  return { supabase, user, error: null };
}

function normalizarActividad(
  row: Record<string, unknown>,
  creador?: CreadorActividad | null,
): ActividadRecord {
  const createdBy =
    typeof row.created_by === "string" && row.created_by
      ? row.created_by
      : null;
  const nombre = String(row.nombre ?? "");
  const slugGuardado =
    typeof row.slug === "string" && row.slug.trim() ? row.slug.trim() : "";

  return {
    id: String(row.id),
    slug: slugGuardado || slugifyNombreActividad(nombre) || "actividad",
    nombre,
    descripcion: (row.descripcion as string | null) ?? null,
    fecha_realizacion: String(
      row.fecha_realizacion ?? row.created_at ?? "",
    ).split("T")[0],
    direccion: String(row.direccion ?? ""),
    departamento: String(row.departamento ?? ""),
    municipio: String(row.municipio ?? ""),
    activo: row.activo !== false,
    created_by: createdBy,
    created_at: String(row.created_at ?? ""),
    updated_at: (row.updated_at as string | null) ?? null,
    total_registros:
      typeof row.total_registros === "number" ? row.total_registros : undefined,
    creador_nombre: creador?.nombre?.trim() || null,
    creador_oficina: creador?.oficina?.trim() || null,
  };
}

async function generarSlugUnico(
  supabase: SupabaseServerClient,
  nombre: string,
  excludeId?: string,
): Promise<string> {
  const base = slugifyNombreActividad(nombre) || "actividad";
  let candidato = base;
  let n = 2;

  while (true) {
    let query = supabase
      .from(ACT_TABLAS.actividades)
      .select("id")
      .eq("slug", candidato)
      .limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidato;
    candidato = `${base}-${n}`;
    n += 1;
  }
}

async function persistirSlugSiFalta(
  supabase: SupabaseServerClient,
  row: Record<string, unknown>,
): Promise<string> {
  const id = String(row.id);
  const nombre = String(row.nombre ?? "");
  const actual =
    typeof row.slug === "string" && row.slug.trim() ? row.slug.trim() : "";
  if (actual) return actual;

  const slug = await generarSlugUnico(supabase, nombre, id);
  const { error } = await supabase
    .from(ACT_TABLAS.actividades)
    .update({ slug })
    .eq("id", id);
  if (error?.message?.includes("slug")) return slug;
  return slug;
}

async function puedeVerActividad(
  user: { id: string; user_metadata?: { rol?: string }; role?: string },
  createdBy: string | null,
): Promise<boolean> {
  const role = roleFromUser(user);
  return isPrivilegedAsistenciaRole(role) || createdBy === user.id;
}

async function fetchActividadRowByRef(
  supabase: SupabaseServerClient,
  user: { id: string; user_metadata?: { rol?: string }; role?: string },
  ref: string,
): Promise<Record<string, unknown> | null> {
  const privileged = isPrivilegedAsistenciaRole(roleFromUser(user));

  const resolverFila = async (
    row: Record<string, unknown> | null,
  ): Promise<Record<string, unknown> | null> => {
    if (!row) return null;
    const createdBy =
      typeof row.created_by === "string" ? row.created_by : null;
    if (!(await puedeVerActividad(user, createdBy))) return null;
    const slug = await persistirSlugSiFalta(supabase, row);
    return { ...row, slug };
  };

  if (esUuidActividad(ref)) {
    const { data } = await supabase
      .from(ACT_TABLAS.actividades)
      .select("*")
      .eq("id", ref)
      .maybeSingle();
    return resolverFila(data as Record<string, unknown> | null);
  }

  const { data: porSlug } = await supabase
    .from(ACT_TABLAS.actividades)
    .select("*")
    .eq("slug", ref)
    .maybeSingle();

  const filaSlug = await resolverFila(porSlug as Record<string, unknown> | null);
  if (filaSlug) return filaSlug;

  let query = supabase.from(ACT_TABLAS.actividades).select("*");
  if (!privileged) query = query.eq("created_by", user.id);
  const { data: filas } = await query;

  const coincidencia = (filas ?? []).find((row) => {
    const nombre = String(row.nombre ?? "");
    const slugRow =
      typeof row.slug === "string" && row.slug.trim()
        ? row.slug.trim()
        : slugifyNombreActividad(nombre);
    return slugRow === ref;
  });

  if (!coincidencia) return null;
  const slug = await persistirSlugSiFalta(
    supabase,
    coincidencia as Record<string, unknown>,
  );
  return { ...(coincidencia as Record<string, unknown>), slug };
}

function normalizarParticipante(row: Record<string, unknown>): ParticipanteRecord {
  return {
    dpi: String(row.dpi ?? ""),
    nombre: String(row.nombre ?? ""),
    fecha_nacimiento: String(row.fecha_nacimiento ?? "").split("T")[0],
    genero: row.genero as ParticipanteRecord["genero"],
    email: (row.email as string | null) ?? null,
    telefono: (row.telefono as string | null) ?? null,
    es_trifinio: row.es_trifinio === true,
    institucion: (row.institucion as string | null) ?? null,
    puesto: (row.puesto as string | null) ?? null,
    direccion_administrativa:
      (row.direccion_administrativa as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: (row.updated_at as string | null) ?? null,
  };
}

function registroDesdeDpiRow(
  data: Record<string, unknown>,
  digits: string,
): ParticipanteRecord {
  return normalizarParticipante({ ...data, dpi: digits, updated_at: null });
}

function normalizarRegistro(row: Record<string, unknown>): RegistroAsistenciaRecord {
  return {
    id: String(row.id),
    actividad_id: String(row.actividad_id),
    dpi: String(row.dpi ?? ""),
    nombre: String(row.nombre ?? ""),
    puesto: (row.puesto as string | null) ?? null,
    direccion_administrativa:
      (row.direccion_administrativa as string | null) ?? null,
    fecha_nacimiento: String(row.fecha_nacimiento ?? "").split("T")[0],
    genero: (row.genero ?? "masculino") as RegistroAsistenciaRecord["genero"],
    email: (row.email as string | null) ?? null,
    telefono: (row.telefono as string | null) ?? null,
    es_trifinio: row.es_trifinio === true,
    institucion: (row.institucion as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
  };
}

export async function getActividades(): Promise<ActividadRecord[]> {
  const auth = await requireAuth();
  if (!auth.supabase || !auth.user) return [];

  const role = roleFromUser(auth.user);
  const privileged = isPrivilegedAsistenciaRole(role);

  let query = auth.supabase
    .from(ACT_TABLAS.actividades)
    .select(`*, ${ACT_TABLAS.registros}(count)`)
    .order("created_at", { ascending: false });

  if (!privileged) {
    query = query.eq("created_by", auth.user.id);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const creadores = await resolveCreadores(
    auth.supabase,
    data.map((row) => row.created_by as string | null),
  );

  return data.map((row) => {
    const count = Array.isArray(row.act_registros)
      ? (row.act_registros[0] as { count: number } | undefined)?.count ?? 0
      : 0;
    const createdBy =
      typeof row.created_by === "string" ? row.created_by : null;
    return normalizarActividad(
      { ...row, total_registros: count },
      createdBy ? creadores.get(createdBy) : null,
    );
  });
}

export async function getActividadPublica(
  ref: string,
): Promise<ActividadRecord | null> {
  const supabase = createPublicClient();

  const resolverFila = async (
    row: Record<string, unknown> | null,
  ): Promise<ActividadRecord | null> => {
    if (!row || row.activo !== true) return null;
    return normalizarActividad(row);
  };

  if (esUuidActividad(ref)) {
    const { data, error } = await supabase
      .from(ACT_TABLAS.actividades)
      .select("*")
      .eq("id", ref)
      .eq("activo", true)
      .maybeSingle();
    if (error || !data) return null;
    return resolverFila(data as Record<string, unknown>);
  }

  const { data: porSlug } = await supabase
    .from(ACT_TABLAS.actividades)
    .select("*")
    .eq("slug", ref)
    .eq("activo", true)
    .maybeSingle();

  const filaSlug = await resolverFila(porSlug as Record<string, unknown> | null);
  if (filaSlug) return filaSlug;

  const { data: filas } = await supabase
    .from(ACT_TABLAS.actividades)
    .select("*")
    .eq("activo", true);

  const coincidencia = (filas ?? []).find((row) => {
    const nombre = String(row.nombre ?? "");
    const slugRow =
      typeof row.slug === "string" && row.slug.trim()
        ? row.slug.trim()
        : slugifyNombreActividad(nombre);
    return slugRow === ref;
  });

  if (!coincidencia) return null;
  return resolverFila(coincidencia as Record<string, unknown>);
}

export async function getActividad(ref: string): Promise<ActividadRecord | null> {
  const auth = await requireAuth();
  if (!auth.supabase || !auth.user) return null;

  const row = await fetchActividadRowByRef(auth.supabase, auth.user, ref);
  if (!row) return null;

  const createdBy =
    typeof row.created_by === "string" ? row.created_by : null;
  const creadores = await resolveCreadores(auth.supabase, [createdBy]);
  return normalizarActividad(
    row,
    createdBy ? creadores.get(createdBy) : null,
  );
}

export async function getParticipantePorDpi(
  dpi: string,
): Promise<ParticipanteRecord | null> {
  const digits = dpi.replace(/\D/g, "");
  if (digits.length !== 13) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from(ACT_TABLAS.registros)
    .select("*")
    .eq("dpi", digits)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return registroDesdeDpiRow(data, digits);
}

export async function buscarDpisRegistrados(
  query: string,
): Promise<DpiSugerencia[]> {
  const digits = query.replace(/\D/g, "");
  if (digits.length < 3) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from(ACT_TABLAS.registros)
    .select("dpi, nombre, created_at")
    .not("dpi", "is", null)
    .like("dpi", `${digits}%`)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error || !data) return [];

  const vistos = new Set<string>();
  const resultado: DpiSugerencia[] = [];

  for (const row of data) {
    const dpi = String(row.dpi ?? "");
    if (dpi.length !== 13 || vistos.has(dpi)) continue;
    vistos.add(dpi);
    resultado.push({
      dpi,
      nombre: String(row.nombre ?? ""),
    });
    if (resultado.length >= 8) break;
  }

  return resultado;
}

export async function getRegistrosActividad(
  ref: string,
): Promise<RegistroAsistenciaRecord[]> {
  const auth = await requireAuth();
  if (!auth.supabase || !auth.user) return [];

  const actividad = await getActividad(ref);
  if (!actividad) return [];

  const { data, error } = await auth.supabase
    .from(ACT_TABLAS.registros)
    .select("*")
    .eq("actividad_id", actividad.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(normalizarRegistro);
}

export async function createActividad(
  values: ActividadFormValues,
): Promise<ActionResultWithId> {
  const auth = await requireAuth();
  if (!auth.supabase) return { success: false, error: auth.error };

  const parsed = actividadFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  const slug = await generarSlugUnico(auth.supabase, parsed.data.nombre);

  const basePayload = {
    nombre: parsed.data.nombre,
    descripcion: parsed.data.descripcion || null,
    fecha_realizacion: parsed.data.fecha_realizacion,
    direccion: parsed.data.direccion,
    departamento: parsed.data.departamento,
    municipio: parsed.data.municipio,
    activo: parsed.data.activo,
    created_by: auth.user!.id,
  };

  let { data, error } = await auth.supabase
    .from(ACT_TABLAS.actividades)
    .insert({ ...basePayload, slug })
    .select("id, slug")
    .single();

  if (error?.message?.includes("slug")) {
    ({ data, error } = await auth.supabase
      .from(ACT_TABLAS.actividades)
      .insert(basePayload)
      .select("id")
      .single());
  }

  if (error) return mapDbError(error);
  if (!data) {
    return { success: false, error: "No se pudo crear la actividad" };
  }
  return {
    success: true,
    error: null,
    id: data.id,
    slug: String((data as { slug?: string }).slug ?? slug),
  };
}

async function assertPuedeMutarActividad(
  supabase: SupabaseServerClient,
  user: { id: string; user_metadata?: { rol?: string }; role?: string },
  id: string,
): Promise<ActionResult | null> {
  const role = roleFromUser(user);
  if (isPrivilegedAsistenciaRole(role)) return null;

  const { data, error } = await supabase
    .from(ACT_TABLAS.actividades)
    .select("created_by")
    .eq("id", id)
    .maybeSingle();

  if (error) return mapDbError(error);
  if (!data) return { success: false, error: "NOT_FOUND" };
  if (data.created_by !== user.id) {
    return { success: false, error: "FORBIDDEN" };
  }
  return null;
}

export async function updateActividad(
  id: string,
  values: ActividadFormValues,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.supabase || !auth.user) {
    return { success: false, error: auth.error };
  }

  const parsed = actividadFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  const denied = await assertPuedeMutarActividad(
    auth.supabase,
    auth.user,
    id,
  );
  if (denied) return denied;

  const slug = await generarSlugUnico(
    auth.supabase,
    parsed.data.nombre,
    id,
  );

  const { error } = await auth.supabase
    .from(ACT_TABLAS.actividades)
    .update({
      nombre: parsed.data.nombre,
      slug,
      descripcion: parsed.data.descripcion || null,
      fecha_realizacion: parsed.data.fecha_realizacion,
      direccion: parsed.data.direccion,
      departamento: parsed.data.departamento,
      municipio: parsed.data.municipio,
      activo: parsed.data.activo,
      updated_by: auth.user.id,
    })
    .eq("id", id);

  if (error?.message?.includes("slug")) {
    const retry = await auth.supabase
      .from(ACT_TABLAS.actividades)
      .update({
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion || null,
        fecha_realizacion: parsed.data.fecha_realizacion,
        direccion: parsed.data.direccion,
        departamento: parsed.data.departamento,
        municipio: parsed.data.municipio,
        activo: parsed.data.activo,
        updated_by: auth.user.id,
      })
      .eq("id", id);
    if (retry.error) return mapDbError(retry.error);
    return { success: true, error: null };
  }

  if (error) return mapDbError(error);
  return { success: true, error: null };
}

export async function deleteActividad(id: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.supabase || !auth.user) {
    return { success: false, error: auth.error };
  }

  const role = roleFromUser(auth.user);
  if (!canEliminarActividadAsistencia(role)) {
    return { success: false, error: "FORBIDDEN" };
  }

  const { error } = await auth.supabase
    .from(ACT_TABLAS.actividades)
    .delete()
    .eq("id", id);

  if (error) return mapDbError(error);
  return { success: true, error: null };
}

export async function registrarAsistencia(
  values: RegistroPublicoValues,
): Promise<ActionResult> {
  const parsed = registroPublicoSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  const supabase = createPublicClient();
  const data = parsed.data;

  const { data: actividad } = await supabase
    .from(ACT_TABLAS.actividades)
    .select("id, activo, departamento, municipio")
    .eq("id", data.actividad_id)
    .eq("activo", true)
    .maybeSingle();

  if (!actividad) return { success: false, error: "NOT_FOUND" };

  const departamentoActividad = String(actividad.departamento ?? "");
  const municipioActividad = String(actividad.municipio ?? "");
  if (!departamentoActividad || !municipioActividad) {
    return {
      success: false,
      error: "NOT_FOUND",
      detail: "La actividad no tiene ubicación configurada.",
    };
  }

  const { data: existente, error: dupError } = await supabase
    .from(ACT_TABLAS.registros)
    .select("id")
    .eq("actividad_id", data.actividad_id)
    .eq("dpi", data.dpi)
    .maybeSingle();

  if (dupError && !dupError.message.includes("dpi")) {
    return mapDbError(dupError);
  }

  if (existente) {
    return {
      success: false,
      error: "DUPLICATE",
      detail: "Este DPI ya está registrado en esta actividad.",
    };
  }

  const registroPayload = {
    actividad_id: data.actividad_id,
    dpi: data.dpi,
    nombre: data.nombre,
    fecha_nacimiento: data.fecha_nacimiento.split("T")[0],
    genero: data.genero,
    email: data.email?.trim() || null,
    telefono: data.telefono?.trim() || null,
    es_trifinio: esTrifinioDesdeTipo(data.tipo_institucion),
    institucion: resolverInstitucion({
      tipo_institucion: data.tipo_institucion,
      institucion_otra: data.institucion_otra,
    }),
    puesto: data.puesto?.trim() || null,
    direccion_administrativa: null,
  };

  const { error } = await supabase
    .from(ACT_TABLAS.registros)
    .insert(registroPayload);

  if (error) return mapDbError(error);

  return { success: true, error: null };
}

export async function updateRegistro(
  values: RegistroEditValues,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.supabase) return { success: false, error: auth.error };

  const parsed = registroEditSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  const data = parsed.data;

  const { data: existente, error: dupError } = await auth.supabase
    .from(ACT_TABLAS.registros)
    .select("id")
    .eq("actividad_id", data.actividad_id)
    .eq("dpi", data.dpi)
    .neq("id", data.id)
    .maybeSingle();

  if (dupError) return mapDbError(dupError);

  if (existente) {
    return {
      success: false,
      error: "DUPLICATE",
      detail: "Este DPI ya está registrado en esta actividad.",
    };
  }

  const payload = {
    dpi: data.dpi,
    nombre: data.nombre,
    fecha_nacimiento: data.fecha_nacimiento.split("T")[0],
    genero: data.genero,
    email: data.email?.trim() || null,
    telefono: data.telefono?.trim() || null,
    es_trifinio: esTrifinioDesdeTipo(data.tipo_institucion),
    institucion: resolverInstitucion({
      tipo_institucion: data.tipo_institucion,
      institucion_otra: data.institucion_otra,
    }),
    puesto: data.puesto?.trim() || null,
    direccion_administrativa: null,
  };

  const { error } = await auth.supabase
    .from(ACT_TABLAS.registros)
    .update(payload)
    .eq("id", data.id);

  if (error) return mapDbError(error);
  return { success: true, error: null };
}

export async function deleteRegistro(id: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from(ACT_TABLAS.registros)
    .delete()
    .eq("id", id);

  if (error) return mapDbError(error);
  return { success: true, error: null };
}

export type MinutaUsuarioOpcion = {
  tipo: MinutaMencionTipo;
  id: string;
  mencionId: string;
  nombre: string;
  detalle: string;
  dependencia: string;
};

export type MinutaElaboro = {
  nombre: string;
  puesto: string;
};

export async function getElaboroMinuta(): Promise<MinutaElaboro | null> {
  const auth = await requireAuth();
  if (!auth.supabase || !auth.user) return null;

  const meta = auth.user.user_metadata ?? {};
  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("nombre, puesto_id")
    .eq("id", auth.user.id)
    .maybeSingle();

  const nombre = String(
    meta.nombre ?? profile?.nombre ?? "",
  ).trim();

  if (!nombre) return null;

  const puestoId = (profile?.puesto_id as string | null) ?? null;
  if (!puestoId) return { nombre, puesto: "" };

  const { data: puesto } = await auth.supabase
    .from("puestos")
    .select("nombre")
    .eq("id", puestoId)
    .maybeSingle();

  return { nombre, puesto: String(puesto?.nombre ?? "").trim() };
}

export async function getUsuariosParaMinuta(): Promise<MinutaUsuarioOpcion[]> {
  const auth = await requireAuth();
  if (!auth.supabase) return [];

  const { data, error } = await auth.supabase
    .from("vw_minuta_menciones")
    .select("tipo, referencia_id, mencion_id, nombre, detalle, dependencia")
    .order("nombre");

  if (error || !data) return [];

  return data
    .map((row) => ({
      tipo: String(row.tipo) as MinutaMencionTipo,
      id: String(row.referencia_id),
      mencionId: String(row.mencion_id),
      nombre: String(row.nombre ?? "").trim(),
      detalle: String(row.detalle ?? "").trim(),
      dependencia: String(row.dependencia ?? "").trim(),
    }))
    .filter((row) => row.nombre.length > 0);
}

function minutaDesdeRow(
  row: Record<string, unknown>,
  actividad: { id: string; nombre: string; fecha_realizacion: string },
): MinutaRecord {
  const actividades = Array.isArray(row.actividades_realizadas)
    ? (row.actividades_realizadas as MinutaActividadBloque[])
    : [];

  return {
    id: String(row.id),
    actividadId: actividad.id,
    fecha: actividad.fecha_realizacion,
    actividadNombre: actividad.nombre,
    institucion: String(row.institucion ?? ""),
    elaboro: String(row.elaboro ?? ""),
    estado: row.estado === "finalizada" ? "finalizada" : "borrador",
    introduccion: String(row.introduccion ?? ""),
    actividadesRealizadas: actividades.length
      ? actividades
      : [crearActividadBloqueVacio()],
    acuerdos: Array.isArray(row.acuerdos)
      ? (row.acuerdos as MinutaAcuerdo[])
      : [],
    compromisosGenerales: String(row.compromisos_generales ?? ""),
    anexosNota: String(row.anexos_nota ?? ""),
    anexos: Array.isArray(row.anexos) ? (row.anexos as MinutaAnexo[]) : [],
    updatedAt: String(row.updated_at ?? row.created_at ?? ""),
  };
}

export async function getMinuta(
  actividadRef: string,
): Promise<MinutaRecord | null> {
  const auth = await requireAuth();
  if (!auth.supabase || !auth.user) return null;

  const actividadRow = await fetchActividadRowByRef(
    auth.supabase,
    auth.user,
    actividadRef,
  );
  if (!actividadRow) return null;

  const actividad = {
    id: String(actividadRow.id),
    nombre: String(actividadRow.nombre ?? ""),
    fecha_realizacion: String(
      actividadRow.fecha_realizacion ?? actividadRow.created_at ?? "",
    ).split("T")[0],
  };

  const { data, error } = await auth.supabase
    .from(ACT_TABLAS.minutas)
    .select("*")
    .eq("actividad_id", actividad.id)
    .maybeSingle();

  if (error || !data) {
    return crearMinutaVacia({
      id: actividad.id,
      nombre: actividad.nombre,
      fecha_realizacion: actividad.fecha_realizacion,
    } as ActividadRecord);
  }

  return minutaDesdeRow(data as Record<string, unknown>, actividad);
}

/**
 * Aplana las menciones de la minuta para reconstruir act_minuta_responsables.
 * Cada fila conserva dónde se hizo la mención para poder consultar después
 * "qué compromisos tiene asignados una persona o una dependencia".
 */
function filasResponsables(
  minutaId: string,
  values: MinutaGuardarValues,
): Array<Record<string, unknown>> {
  const filas: Array<Record<string, unknown>> = [];
  const vistos = new Set<string>();

  const agregar = (
    seccion: string,
    bloqueId: string | null,
    itemIndice: number | null,
    mencion: MinutaMencionValues,
  ) => {
    const clave = [
      seccion,
      bloqueId ?? "",
      itemIndice ?? -1,
      mencion.tipo,
      mencion.id,
    ].join("|");
    if (vistos.has(clave)) return;
    vistos.add(clave);

    filas.push({
      minuta_id: minutaId,
      seccion,
      bloque_id: bloqueId,
      item_indice: itemIndice,
      tipo: mencion.tipo,
      profile_id: mencion.tipo === "usuario" ? mencion.id : null,
      departamento_id: mencion.tipo === "departamento" ? mencion.id : null,
      puesto_id: mencion.tipo === "puesto" ? mencion.id : null,
      nombre: mencion.nombre,
    });
  };

  for (const mencion of extraerMenciones(values.introduccion)) {
    agregar("introduccion", null, null, mencion);
  }

  for (const bloque of values.actividadesRealizadas) {
    bloque.items.forEach((item, indice) => {
      for (const mencion of extraerMenciones(item)) {
        agregar("actividad", bloque.id, indice, mencion);
      }
    });
  }

  for (const acuerdo of values.acuerdos) {
    for (const mencion of acuerdo.responsables) {
      agregar("acuerdo", acuerdo.id, null, mencion);
    }
    acuerdo.items.forEach((item, indice) => {
      for (const mencion of extraerMenciones(item)) {
        agregar("compromiso", acuerdo.id, indice, mencion);
      }
    });
  }

  for (const mencion of extraerMenciones(values.compromisosGenerales)) {
    agregar("compromisos_generales", null, null, mencion);
  }

  return filas;
}

export async function guardarMinuta(
  values: MinutaGuardarValues,
): Promise<ActionResultWithId> {
  const auth = await requireAuth();
  if (!auth.supabase || !auth.user) {
    return { success: false, error: auth.error };
  }

  const parsed = minutaGuardarSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "VALIDATION",
      detail: parsed.error.issues[0]?.message ?? "Datos de minuta inválidos.",
    };
  }
  const data = parsed.data;

  const actividadRow = await fetchActividadRowByRef(
    auth.supabase,
    auth.user,
    data.actividadId,
  );
  if (!actividadRow) {
    return { success: false, error: "FORBIDDEN", detail: "Actividad no disponible." };
  }

  const payload = {
    actividad_id: data.actividadId,
    institucion: data.institucion,
    elaboro: data.elaboro,
    elaboro_por: auth.user.id,
    estado: data.estado,
    introduccion: data.introduccion,
    actividades_realizadas: data.actividadesRealizadas,
    acuerdos: data.acuerdos,
    compromisos_generales: data.compromisosGenerales,
    anexos_nota: data.anexosNota,
    anexos: data.anexos,
    updated_by: auth.user.id,
  };

  const { data: existente } = await auth.supabase
    .from(ACT_TABLAS.minutas)
    .select("id")
    .eq("actividad_id", data.actividadId)
    .maybeSingle();

  const guardado = existente?.id
    ? await auth.supabase
        .from(ACT_TABLAS.minutas)
        .update(payload)
        .eq("id", existente.id)
        .select("id")
        .single()
    : await auth.supabase
        .from(ACT_TABLAS.minutas)
        .insert({ ...payload, created_by: auth.user.id })
        .select("id")
        .single();

  if (guardado.error) return mapDbError(guardado.error);
  if (!guardado.data) {
    return {
      success: false,
      error: "DB_ERROR",
      detail: "No se pudo guardar la minuta.",
    };
  }

  const minutaId = String(guardado.data.id);

  await auth.supabase
    .from(ACT_TABLAS.responsables)
    .delete()
    .eq("minuta_id", minutaId);

  const filas = filasResponsables(minutaId, data);
  if (filas.length > 0) {
    const { error: errorResponsables } = await auth.supabase
      .from(ACT_TABLAS.responsables)
      .insert(filas);
    if (errorResponsables) return mapDbError(errorResponsables);
  }

  return { success: true, error: null, id: minutaId };
}

export async function eliminarAnexosMinutaStorage(
  paths: string[],
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.supabase) return { success: false, error: auth.error };

  const limpias = paths.map((p) => p.trim()).filter(Boolean);
  if (limpias.length === 0) return { success: true, error: null };

  const { error } = await auth.supabase.storage
    .from(MINUTA_ANEXOS_BUCKET)
    .remove(limpias);

  if (error) {
    return { success: false, error: "STORAGE_ERROR", detail: error.message };
  }
  return { success: true, error: null };
}
