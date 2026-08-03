"use server";

import { createClient } from "@/utils/supabase/server";
import type { AutofillInformeUsuario, ProyectosMemoria } from "./zod";
import {
  proyectosMemoriaSchema,
  type ProyectosMemoriaInput,
} from "./zod";
import {
  normalizeImagenesFromDb,
  normalizeProyectosFromDb,
  periodoFromProyectos,
  sumBeneficiariosProyectos,
} from "./helpers";
import {
  MEMORIA_IMAGENES_BUCKET,
  normalizeImagenStoragePath,
} from "@/components/(base)/imgs/constants";

const TABLE = "cs_proyectos_memoria_labores";
const ALLOWED_ROLES = ["super", "admin", "comunicacion"];

const SELECT_COLUMNS =
  "id, periodo, proyectos, imagenes, created_by, updated_by, created_at, updated_at";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ProfileRow = {
  id: string;
  nombre: string | null;
  puesto_id: string | null;
};

type MemoriaRow = {
  id: string;
  periodo: string;
  proyectos: unknown;
  imagenes: unknown;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
};

function isPrivilegedMemoriaRole(role: string): boolean {
  const normalized = role.toLowerCase();
  return normalized === "super" || normalized.includes("admin");
}

function canVerMemoriasOtrasOficinas(role: string): boolean {
  const normalized = role.toLowerCase();
  return (
    normalized === "super" ||
    normalized.includes("admin") ||
    normalized === "comunicacion"
  );
}

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  return { supabase, user };
}

async function requireRoleAccess() {
  const { supabase, user } = await requireAuth();

  const role =
    (user.user_metadata?.rol as string | undefined) || user.role || "user";

  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error("No tiene permisos para gestionar la memoria de labores.");
  }

  return { supabase, user, role };
}

const RAIZ_PLAN_TRIFINIO = "Plan Trifinio";
const SEPARADOR_JERARQUIA = " · ";

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

async function informanteDesdeProfile(
  supabase: SupabaseServerClient,
  profile: ProfileRow,
): Promise<AutofillInformeUsuario> {
  const nombre = String(profile.nombre ?? "").trim();
  const puestoId = profile.puesto_id;

  if (!puestoId) {
    return { nombre, cargo: "", oficina: "" };
  }

  const { data: puesto } = await supabase
    .from("puestos")
    .select("nombre, departamento_id")
    .eq("id", puestoId)
    .maybeSingle();

  const cargo = String(puesto?.nombre ?? "").trim();
  const departamentoId = (puesto?.departamento_id as string | null) ?? null;
  const oficina = await oficinaDesdePuesto(supabase, puestoId, departamentoId);

  return { nombre, cargo, oficina };
}

async function resolveInformantes(
  supabase: SupabaseServerClient,
  rows: MemoriaRow[],
): Promise<Map<string, AutofillInformeUsuario>> {
  const profileIds = [
    ...new Set(
      rows.map((row) => row.created_by).filter((id): id is string => Boolean(id)),
    ),
  ];

  if (profileIds.length === 0) return new Map();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, nombre, puesto_id")
    .in("id", profileIds);

  if (error || !profiles) return new Map();

  const entries = await Promise.all(
    profiles.map(async (profile) => {
      const informante = await informanteDesdeProfile(
        supabase,
        profile as ProfileRow,
      );
      return [profile.id, informante] as const;
    }),
  );

  return new Map(entries);
}

function normalize(
  row: MemoriaRow,
  informante?: AutofillInformeUsuario | null,
): ProyectosMemoria {
  const proyectos = normalizeProyectosFromDb(row.proyectos);
  return {
    id: row.id,
    periodo: row.periodo,
    proyectos,
    beneficiarios: sumBeneficiariosProyectos(proyectos),
    imagenes: normalizeImagenesFromDb(row.imagenes, proyectos.length),
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? null,
    nombre: informante?.nombre || null,
    cargo: informante?.cargo || null,
    oficina: informante?.oficina || null,
  };
}

function validateAndBuildPayload(input: ProyectosMemoriaInput) {
  const result = proyectosMemoriaSchema.safeParse(input);

  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path?.join(".");
    throw new Error(
      `Datos inválidos${path ? ` (${path})` : ""}: ${issue?.message ?? "revise el formulario."}`,
    );
  }

  const data = result.data;
  return {
    periodo: periodoFromProyectos(data.proyectos),
    proyectos: data.proyectos,
    imagenes: normalizeImagenesFromDb(data.imagenes, data.proyectos.length),
  };
}

async function assertMemoriaOwnership(
  user: { id: string },
  role: string,
  memoria: { created_by?: string | null },
): Promise<void> {
  if (isPrivilegedMemoriaRole(role)) return;
  if (memoria.created_by !== user.id) {
    throw new Error("No tiene permisos para este informe.");
  }
}

export async function getAutofillInformeUsuario(): Promise<AutofillInformeUsuario | null> {
  try {
    const { supabase, user } = await requireAuth();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, nombre, puesto_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) return null;

    return informanteDesdeProfile(supabase, profile as ProfileRow);
  } catch {
    return null;
  }
}

export async function getProyectosMemoria(): Promise<ProyectosMemoria[]> {
  const { supabase, user, role } = await requireRoleAccess();

  let query = supabase.from(TABLE).select(SELECT_COLUMNS);

  if (!canVerMemoriasOtrasOficinas(role)) {
    query = query.eq("created_by", user.id);
  }

  const { data, error } = await query.order("periodo", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as MemoriaRow[];
  const informantes = await resolveInformantes(supabase, rows);

  return rows.map((row) =>
    normalize(row, row.created_by ? informantes.get(row.created_by) : null),
  );
}

export async function getProyectoMemoria(
  id: string,
): Promise<ProyectosMemoria | null> {
  const { supabase, user, role } = await requireRoleAccess();
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  if (!data) return null;

  const row = data as MemoriaRow;

  try {
    await assertMemoriaOwnership(user, role, row);
  } catch {
    return null;
  }

  let informante: AutofillInformeUsuario | null = null;
  if (row.created_by) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, nombre, puesto_id")
      .eq("id", row.created_by)
      .maybeSingle();
    if (profile) {
      informante = await informanteDesdeProfile(supabase, profile as ProfileRow);
    }
  }

  return normalize(row, informante);
}

export async function createProyectoMemoria(
  input: ProyectosMemoriaInput,
): Promise<ProyectosMemoria> {
  const { supabase, user } = await requireRoleAccess();
  const payload = validateAndBuildPayload(input);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      ...payload,
      created_by: user.id,
      updated_by: user.id,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new Error(error.message);

  const row = data as MemoriaRow;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nombre, puesto_id")
    .eq("id", user.id)
    .maybeSingle();

  const informante = profile
    ? await informanteDesdeProfile(supabase, profile as ProfileRow)
    : null;

  return normalize(row, informante);
}

export async function updateProyectoMemoria(
  id: string,
  input: ProyectosMemoriaInput,
): Promise<ProyectosMemoria> {
  const { supabase, user, role } = await requireRoleAccess();
  const payload = validateAndBuildPayload(input);

  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      throw new Error("Informe no encontrado.");
    }
    throw new Error(fetchError.message);
  }

  await assertMemoriaOwnership(user, role, existing as MemoriaRow);

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      ...payload,
      updated_by: user.id,
    })
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new Error(error.message);

  const row = data as MemoriaRow;
  const profileId = row.created_by ?? user.id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nombre, puesto_id")
    .eq("id", profileId)
    .maybeSingle();

  const informante = profile
    ? await informanteDesdeProfile(supabase, profile as ProfileRow)
    : null;

  return normalize(row, informante);
}

function collectImagenPathsFromDb(imagenes: unknown): string[] {
  if (!Array.isArray(imagenes)) return [];
  const paths = new Set<string>();
  for (const grupo of imagenes) {
    if (!Array.isArray(grupo)) continue;
    for (const entry of grupo) {
      if (typeof entry !== "string") continue;
      const clean = normalizeImagenStoragePath(entry);
      if (clean) paths.add(clean);
    }
  }
  return [...paths];
}

export async function deleteProyectoMemoria(id: string): Promise<void> {
  const { supabase, role } = await requireRoleAccess();
  if (!isPrivilegedMemoriaRole(role)) {
    throw new Error("No tiene permisos para eliminar informes.");
  }

  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select("id, imagenes")
    .eq("id", id)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      throw new Error("Informe no encontrado.");
    }
    throw new Error(fetchError.message);
  }

  const paths = collectImagenPathsFromDb((existing as MemoriaRow).imagenes);
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(MEMORIA_IMAGENES_BUCKET)
      .remove(paths);
    if (storageError) {
      throw new Error("No se pudieron eliminar las imágenes del informe.");
    }
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateMemoriaImagenes(
  id: string,
  imagenes: string[][],
): Promise<void> {
  const { supabase, user, role } = await requireRoleAccess();

  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select("id, created_by, proyectos")
    .eq("id", id)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      throw new Error("Informe no encontrado.");
    }
    throw new Error(fetchError.message);
  }

  await assertMemoriaOwnership(user, role, existing as MemoriaRow);

  const proyectos = normalizeProyectosFromDb(
    (existing as MemoriaRow).proyectos,
  );
  const normalized = normalizeImagenesFromDb(imagenes, proyectos.length);

  const { error } = await supabase
    .from(TABLE)
    .update({
      imagenes: normalized,
      updated_by: user.id,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
