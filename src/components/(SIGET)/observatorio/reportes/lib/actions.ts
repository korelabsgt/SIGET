"use server";

import { createClient } from "@/utils/supabase/server";

/* ──────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────── */

export interface ReportRow {
  // valor
  valorId: string;
  cantidad: number;
  // registro
  registroId: string;
  mes: number;
  anio: number;
  createdAt: string;
  // organizacion
  organizacionId: string;
  organizacionNombre: string;
  // indicador_campo
  indicadorCampoId: string;
  campoId: string;
  campoNombre: string;
  campoOrden: number;
  // indicador
  indicadorId: string;
  indicadorNombre: string;
  // politica
  politicaId: string;
  politicaCodigo: string;
  politicaDescripcion: string;
  // sector
  sectorId: string;
  sectorNombre: string;
  // nacionalidad
  nacionalidadId: string | null;
  nacionalidadNombre: string | null;
  // perfil
  perfilId: string | null;
  perfilNombre: string | null;
}

export interface ReportFilters {
  sectorId?: string;
  organizacionId?: string;
  politicaId?: string;
  mes?: number;
  anio?: number;
  mesDesde?: string; // "YYYY-MM"
  mesHasta?: string; // "YYYY-MM"
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T {
  if (value == null) {
    throw new Error("Missing required related record from report query");
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new Error("Empty related record array from report query");
    }
    return value[0];
  }
  return value;
}

/** Supabase nested selects may return a single object or an array */
type Relation<T> = T | T[];

type IdNombre = { id: string; nombre: string };
type ReportSectorJoin = IdNombre;
type ReportPoliticaJoin = {
  id: string;
  codigo: string;
  descripcion: string;
  sector_id: string;
  obs_sectores: Relation<ReportSectorJoin>;
};
type ReportIndicadorJoin = {
  id: string;
  nombre: string;
  politica_id: string;
  obs_politicas: Relation<ReportPoliticaJoin>;
};
type ReportIndicadorCampoJoin = {
  id: string;
  campo_id: string;
  orden: string | number | null;
  indicador_id: string;
  obs_campos: Relation<IdNombre>;
  obs_indicadores: Relation<ReportIndicadorJoin>;
};
type ReportRegistroJoin = {
  id: string;
  mes: number;
  anio: number;
  created_at: string;
  organizacion_id: string;
  obs_organizaciones: Relation<IdNombre>;
};

/** Raw row from nested `obs_registros_valores` select */
type ReportValorQueryRow = {
  id: string;
  cantidad: number | null;
  nacionalidad_id: string | null;
  perfil_id: string | null;
  indicador_campo_id: string;
  registro_id: string;
  obs_registros: Relation<ReportRegistroJoin>;
  obs_indicador_campos: Relation<ReportIndicadorCampoJoin>;
};

function flattenReportRow(
  row: ReportValorQueryRow,
  nacMap: Map<string, string>,
  perfMap: Map<string, string>
): ReportRow {
  const reg = unwrapRelation(row.obs_registros);
  const org = unwrapRelation(reg.obs_organizaciones);
  const ic = unwrapRelation(row.obs_indicador_campos);
  const campo = unwrapRelation(ic.obs_campos);
  const ind = unwrapRelation(ic.obs_indicadores);
  const pol = unwrapRelation(ind.obs_politicas);
  const sec = unwrapRelation(pol.obs_sectores);

  return {
    valorId: row.id,
    cantidad: row.cantidad ?? 0,
    registroId: reg.id,
    mes: reg.mes,
    anio: reg.anio,
    createdAt: reg.created_at,
    organizacionId: org.id,
    organizacionNombre: org.nombre,
    indicadorCampoId: ic.id,
    campoId: campo.id,
    campoNombre: campo.nombre,
    campoOrden: parseInt(String(ic.orden ?? "0"), 10),
    indicadorId: ind.id,
    indicadorNombre: ind.nombre,
    politicaId: pol.id,
    politicaCodigo: pol.codigo,
    politicaDescripcion: pol.descripcion,
    sectorId: sec.id,
    sectorNombre: sec.nombre,
    nacionalidadId: row.nacionalidad_id,
    nacionalidadNombre: row.nacionalidad_id
      ? (nacMap.get(row.nacionalidad_id) ?? "Sin especificar")
      : null,
    perfilId: row.perfil_id,
    perfilNombre: row.perfil_id ? (perfMap.get(row.perfil_id) ?? "Sin especificar") : null,
  };
}

/* ──────────────────────────────────────────────────────────────
   Main query: flat denormalized rows
   ────────────────────────────────────────────────────────────── */

export async function getReportData(): Promise<ReportRow[]> {
  const supabase = await createClient();

  // Fetch all values with nested joins
  const { data, error } = await supabase
    .from("obs_registros_valores")
    .select(`
      id,
      cantidad,
      nacionalidad_id,
      perfil_id,
      indicador_campo_id,
      registro_id,
      obs_registros!inner (
        id,
        mes,
        anio,
        created_at,
        organizacion_id,
        obs_organizaciones!inner ( id, nombre )
      ),
      obs_indicador_campos!inner (
        id,
        campo_id,
        orden,
        indicador_id,
        obs_campos!inner ( id, nombre ),
        obs_indicadores!inner (
          id,
          nombre,
          politica_id,
          obs_politicas!inner (
            id,
            codigo,
            descripcion,
            sector_id,
            obs_sectores!inner ( id, nombre )
          )
        )
      )
    `)
    .order("id");

  if (error) throw new Error(error.message);
  if (!data) return [];

  // Fetch nacionalidades & perfiles lookup tables in parallel
  const [nacRes, perfRes] = await Promise.all([
    supabase.from("obs_nacionalidades").select("id, nombre"),
    supabase.from("obs_perfiles").select("id, nombre"),
  ]);

  const nacMap = new Map<string, string>();
  for (const n of nacRes.data || []) nacMap.set(n.id, n.nombre);

  const perfMap = new Map<string, string>();
  for (const p of perfRes.data || []) perfMap.set(p.id, p.nombre);

  const rows = data as unknown as ReportValorQueryRow[];
  return rows.map((row) => flattenReportRow(row, nacMap, perfMap));
}

/* ──────────────────────────────────────────────────────────────
   Catalog loaders (for filter dropdowns)
   ────────────────────────────────────────────────────────────── */

export async function getReportSectores() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("obs_sectores").select("id, nombre").order("nombre");
  if (error) throw new Error(error.message);
  return data as { id: string; nombre: string }[];
}

export async function getReportOrganizaciones() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("obs_organizaciones").select("id, nombre").order("nombre");
  if (error) throw new Error(error.message);
  return data as { id: string; nombre: string }[];
}

export async function getReportPoliticas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_politicas")
    .select("id, codigo, descripcion, sector_id")
    .eq("activo", true)
    .order("codigo");
  if (error) throw new Error(error.message);
  return data as { id: string; codigo: string; descripcion: string; sector_id: string }[];
}
