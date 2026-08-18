"use server";

import { createClient } from "@/utils/supabase/server";
import { createPublicClient } from "@/utils/supabase/public";
import {
  actividadFormSchema,
  registroPublicoSchema,
  registroEditSchema,
  type ActividadFormValues,
  type ActividadRecord,
  type ParticipanteRecord,
  type RegistroAsistenciaRecord,
  type RegistroPublicoValues,
  type RegistroEditValues,
  resolverInstitucion,
  esTrifinioDesdeTipo,
} from "./zod";
import {
  canEliminarActividadAsistencia,
  isPrivilegedAsistenciaRole,
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
type ActionResultWithId = ActionResult & { id?: string };

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

  return {
    id: String(row.id),
    nombre: String(row.nombre ?? ""),
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
    .from("asist_actividades")
    .select("*, asist_registros(count)")
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
    const count = Array.isArray(row.asist_registros)
      ? (row.asist_registros[0] as { count: number } | undefined)?.count ?? 0
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
  id: string,
): Promise<ActividadRecord | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("asist_actividades")
    .select("*")
    .eq("id", id)
    .eq("activo", true)
    .maybeSingle();

  if (error || !data) return null;
  return normalizarActividad(data);
}

export async function getActividad(id: string): Promise<ActividadRecord | null> {
  const auth = await requireAuth();
  if (!auth.supabase || !auth.user) return null;

  const { data, error } = await auth.supabase
    .from("asist_actividades")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const role = roleFromUser(auth.user);
  const createdBy =
    typeof data.created_by === "string" ? data.created_by : null;
  if (
    !isPrivilegedAsistenciaRole(role) &&
    createdBy !== auth.user.id
  ) {
    return null;
  }

  const creadores = await resolveCreadores(auth.supabase, [createdBy]);
  return normalizarActividad(
    data,
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
    .from("asist_registros")
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
    .from("asist_registros")
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
  actividadId: string,
): Promise<RegistroAsistenciaRecord[]> {
  const auth = await requireAuth();
  if (!auth.supabase || !auth.user) return [];

  const actividad = await getActividad(actividadId);
  if (!actividad) return [];

  const { data, error } = await auth.supabase
    .from("asist_registros")
    .select("*")
    .eq("actividad_id", actividadId)
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

  const { data, error } = await auth.supabase
    .from("asist_actividades")
    .insert({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      fecha_realizacion: parsed.data.fecha_realizacion,
      direccion: parsed.data.direccion,
      departamento: parsed.data.departamento,
      municipio: parsed.data.municipio,
      activo: parsed.data.activo,
      created_by: auth.user!.id,
    })
    .select("id")
    .single();

  if (error) return mapDbError(error);
  return { success: true, error: null, id: data.id };
}

async function assertPuedeMutarActividad(
  supabase: SupabaseServerClient,
  user: { id: string; user_metadata?: { rol?: string }; role?: string },
  id: string,
): Promise<ActionResult | null> {
  const role = roleFromUser(user);
  if (isPrivilegedAsistenciaRole(role)) return null;

  const { data, error } = await supabase
    .from("asist_actividades")
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

  const { error } = await auth.supabase
    .from("asist_actividades")
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
    .from("asist_actividades")
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
    .from("asist_actividades")
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
    .from("asist_registros")
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
    .from("asist_registros")
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
    .from("asist_registros")
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
    .from("asist_registros")
    .update(payload)
    .eq("id", data.id);

  if (error) return mapDbError(error);
  return { success: true, error: null };
}

export async function deleteRegistro(id: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("asist_registros")
    .delete()
    .eq("id", id);

  if (error) return mapDbError(error);
  return { success: true, error: null };
}
