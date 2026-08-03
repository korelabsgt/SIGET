"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { z } from "zod";
import {
  createOrganizacionInputSchema,
  createPoliticaConIndicadoresInputSchema,
  createPoliticaInputSchema,
  createPredefinedFieldInputSchema,
  createRegistroInputSchema,
  createSectorInputSchema,
  deleteRegistroInputSchema,
  nombreInputSchema,
  orgSectorIdsInputSchema,
  unwrapRelation,
  updateOrganizacionNombreInputSchema,
  updatePredefinedFieldInputSchema,
  type FormIndicador,
  type ObsCampo,
  type ObsIndicador,
  type ObsNacionalidad,
  type ObsOrganizacion,
  type ObsPerfil,
  type ObsPolitica,
  type ObsPredefinedField,
  type ObsSector,
  type OrgSectorLinkRow,
  type OrgSectorLinkWithSector,
  type OrgWithSectors,
  type ProfileCreatorRow,
  type RegistroEntrada,
  type RegistroHistorico,
  type RegistroHistoricoQueryRow,
  type RegistroHistoricoValor,
} from "./zod";

export type {
  ConstructorInitialData,
  FormIndicador,
  FormValor,
  ObsCampo,
  ObsIndicador,
  ObsIndicadorCampo,
  ObsNacionalidad,
  ObsOrganizacion,
  ObsPerfil,
  ObsPolitica,
  ObsPredefinedField,
  ObsSector,
  OrgWithSectors,
  RegistroEntrada,
  RegistroHistorico,
  RegistroHistoricoPolitica,
  RegistroHistoricoValor,
} from "./zod";

function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  return parsed.data;
}

export async function getSectores() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("obs_sectores").select("*").order("nombre");
  if (error) throw new Error(error.message);
  return data as ObsSector[];
}

export async function getOrganizacionesBySector(sectorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_organizaciones_sectores")
    .select("organizacion_id, obs_organizaciones(id, nombre, logo)")
    .eq("sector_id", sectorId);
  if (error) throw new Error(error.message);

  return ((data ?? []) as OrgSectorLinkRow[])
    .map((row) => unwrapRelation(row.obs_organizaciones))
    .filter((org): org is ObsOrganizacion => org != null);
}

export async function getSectorIdsByOrganizacion(organizacionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_organizaciones_sectores")
    .select("sector_id")
    .eq("organizacion_id", organizacionId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.sector_id as string);
}

export async function getPoliticasBySector(sectorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_politicas")
    .select("*")
    .eq("sector_id", sectorId)
    .eq("activo", true)
    .order("codigo");
  if (error) throw new Error(error.message);
  return data as ObsPolitica[];
}

export async function getAllPoliticas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_politicas")
    .select("*, obs_sectores(nombre)")
    .order("codigo", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function getAllRegistros() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_registros")
    .select("*, obs_organizaciones(nombre)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getRegistrosHistoricos(
  organizacionId?: string,
): Promise<RegistroHistorico[]> {
  const supabase = await createClient();

  let query = supabase
    .from("obs_registros")
    .select(
      `
      id,
      mes,
      anio,
      created_at,
      created_by,
      organizacion_id,
      obs_organizaciones ( nombre ),
      obs_registros_valores (
        id,
        cantidad,
        nacionalidad_id,
        perfil_id,
        obs_indicador_campos (
          orden,
          obs_campos ( nombre ),
          obs_indicadores (
            nombre,
            obs_politicas (
              id,
              codigo,
              descripcion,
              sector_id,
              obs_sectores ( nombre )
            )
          )
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (organizacionId) {
    query = query.eq("organizacion_id", organizacionId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data) return [];

  const rows = data as RegistroHistoricoQueryRow[];

  const creatorIds = [
    ...new Set(rows.map((r) => r.created_by).filter(Boolean)),
  ] as string[];

  const [nacRes, perfRes, creatorsRes] = await Promise.all([
    supabase.from("obs_nacionalidades").select("id, nombre"),
    supabase.from("obs_perfiles").select("id, nombre"),
    creatorIds.length > 0
      ? supabase.from("profiles").select("id, nombre, email").in("id", creatorIds)
      : Promise.resolve({ data: [] as ProfileCreatorRow[], error: null }),
  ]);

  const nacMap = new Map<string, string>(
    (nacRes.data ?? []).map((n) => [n.id, n.nombre]),
  );
  const perfMap = new Map<string, string>(
    (perfRes.data ?? []).map((p) => [p.id, p.nombre]),
  );
  const creatorMap = new Map<string, { nombre: string | null; email: string | null }>(
    (creatorsRes.data ?? []).map((p) => [
      p.id,
      { nombre: p.nombre ?? null, email: p.email ?? null },
    ]),
  );

  return rows.map((reg) => {
    const org = unwrapRelation(reg.obs_organizaciones);
    const rawValores = reg.obs_registros_valores ?? [];

    const valores: RegistroHistoricoValor[] = rawValores.map((v) => {
      const ic = unwrapRelation(v.obs_indicador_campos);
      const campo = unwrapRelation(ic?.obs_campos ?? null);
      const ind = unwrapRelation(ic?.obs_indicadores ?? null);
      const pol = unwrapRelation(ind?.obs_politicas ?? null);
      const sec = unwrapRelation(pol?.obs_sectores ?? null);

      return {
        id: v.id,
        cantidad: v.cantidad ?? 0,
        campoNombre: campo?.nombre ?? "Sin especificar",
        campoOrden: parseInt(String(ic?.orden ?? "0"), 10),
        indicadorNombre: ind?.nombre ?? "Sin especificar",
        politicaId: pol?.id ?? null,
        politicaCodigo: pol?.codigo ?? "—",
        politicaDescripcion: pol?.descripcion ?? "",
        sectorId: pol?.sector_id ?? null,
        sectorNombre: sec?.nombre ?? "Sin especificar",
        nacionalidadNombre: v.nacionalidad_id
          ? (nacMap.get(v.nacionalidad_id) ?? "Sin especificar")
          : null,
        perfilNombre: v.perfil_id
          ? (perfMap.get(v.perfil_id) ?? "Sin especificar")
          : null,
      };
    });

    const totalAtenciones = valores.reduce((s, v) => s + v.cantidad, 0);
    const politicaMap = new Map<string, string>();
    for (const v of valores) {
      if (v.politicaCodigo && v.politicaCodigo !== "—") {
        politicaMap.set(v.politicaCodigo, v.politicaDescripcion);
      }
    }
    const politicas = Array.from(politicaMap.entries())
      .map(([codigo, descripcion]) => ({ codigo, descripcion }))
      .sort((a, b) =>
        a.codigo.localeCompare(b.codigo, "es", { numeric: true }),
      );

    const creator = reg.created_by ? creatorMap.get(reg.created_by) : undefined;

    return {
      id: reg.id,
      mes: reg.mes,
      anio: reg.anio,
      createdAt: reg.created_at,
      createdById: reg.created_by ?? null,
      creadorNombre: creator?.nombre ?? null,
      creadorEmail: creator?.email ?? null,
      organizacionId: reg.organizacion_id,
      organizacionNombre: org?.nombre ?? "Sin organización",
      totalAtenciones,
      totalValores: valores.length,
      politicas,
      valores,
    };
  });
}

export async function deleteRegistro(registroId: string) {
  parseInput(deleteRegistroInputSchema, { registroId });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  const role =
    profile?.rol ||
    (user.user_metadata?.rol as string | undefined) ||
    user.role ||
    "";

  if (!role.includes("admin") && role !== "super") {
    throw new Error("No tiene permisos para eliminar registros.");
  }

  const { error: valoresError } = await supabase
    .from("obs_registros_valores")
    .delete()
    .eq("registro_id", registroId);

  if (valoresError) throw new Error(valoresError.message);

  const { error: registroError } = await supabase
    .from("obs_registros")
    .delete()
    .eq("id", registroId);

  if (registroError) throw new Error(registroError.message);
}

export async function getIndicadoresByPolitica(politicaId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_indicadores")
    .select("*, obs_politicas(*), obs_indicador_campos(*, obs_campos(*))")
    .eq("politica_id", politicaId)
    .eq("activo", true)
    .order("nombre");
  if (error) throw new Error(error.message);
  return data as ObsIndicador[];
}

export async function getAllCampos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_campos")
    .select("*")
    .eq("activo", true)
    .order("nombre");
  if (error) throw new Error(error.message);
  return data as ObsCampo[];
}

export async function getPredefinedFields(): Promise<ObsPredefinedField[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_campos")
    .select("id, nombre, orden")
    .eq("activo", true);

  if (error) {
    const { data: fallback, error: fallbackError } = await supabase
      .from("obs_campos")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre", { ascending: true });
    if (fallbackError) throw new Error(fallbackError.message);
    return (fallback ?? []).map((row, index) => ({
      id: row.id,
      nombre: row.nombre,
      orden: index + 1,
    }));
  }

  return (data ?? [])
    .map((row, index) => ({
      id: row.id,
      nombre: row.nombre,
      orden: typeof row.orden === "number" ? row.orden : index + 1,
    }))
    .sort(
      (a, b) =>
        a.orden - b.orden ||
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
    );
}

export async function createPredefinedField(nombre: string, orden: number) {
  const input = parseInput(createPredefinedFieldInputSchema, { nombre, orden });
  const supabase = await createClient();

  let result = await supabase
    .from("obs_campos")
    .insert({ nombre: input.nombre, activo: true, orden: input.orden })
    .select("id, nombre, orden")
    .single();

  if (result.error) {
    result = await supabase
      .from("obs_campos")
      .insert({ nombre: input.nombre, activo: true })
      .select("id, nombre")
      .single();
  }

  if (result.error) throw new Error(result.error.message);
  const row = result.data as { id: string; nombre: string; orden?: number | null };
  return {
    id: row.id,
    nombre: row.nombre,
    orden: row.orden ?? input.orden,
  } satisfies ObsPredefinedField;
}

export async function updatePredefinedField(id: string, nombre: string, orden: number) {
  const input = parseInput(updatePredefinedFieldInputSchema, { id, nombre, orden });
  const supabase = await createClient();

  let result = await supabase
    .from("obs_campos")
    .update({ nombre: input.nombre, orden: input.orden })
    .eq("id", input.id)
    .select("id, nombre, orden")
    .single();

  if (result.error) {
    result = await supabase
      .from("obs_campos")
      .update({ nombre: input.nombre })
      .eq("id", input.id)
      .select("id, nombre")
      .single();
  }

  if (result.error) throw new Error(result.error.message);
  const row = result.data as { id: string; nombre: string; orden?: number | null };
  return {
    id: row.id,
    nombre: row.nombre,
    orden: row.orden ?? input.orden,
  } satisfies ObsPredefinedField;
}

export async function deletePredefinedField(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("obs_campos")
    .update({ activo: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createPolitica(sectorId: string, codigo: string, descripcion: string) {
  const input = parseInput(createPoliticaInputSchema, { sectorId, codigo, descripcion });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_politicas")
    .insert({
      sector_id: input.sectorId,
      codigo: input.codigo,
      descripcion: input.descripcion,
      activo: true,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ObsPolitica;
}

async function persistPoliticaIndicadores(
  supabase: Awaited<ReturnType<typeof createClient>>,
  currentPoliticaId: string,
  gruposIndicadores: FormIndicador[],
) {
  for (const grupo of gruposIndicadores) {
    let currentIndicadorId = grupo.id;

    if (grupo.persisted) {
      const { error: indError } = await supabase
        .from("obs_indicadores")
        .update({ nombre: grupo.nombre.trim() })
        .eq("id", grupo.id);

      if (indError) throw new Error(indError.message);
    } else {
      const { data: ind, error: indError } = await supabase
        .from("obs_indicadores")
        .insert({
          politica_id: currentPoliticaId,
          nombre: grupo.nombre.trim(),
          activo: true,
        })
        .select()
        .single();

      if (indError) throw new Error(indError.message);
      currentIndicadorId = ind.id;
    }

    if (grupo.persisted) {
      const { error: deactivateError } = await supabase
        .from("obs_indicador_campos")
        .update({ activo: false })
        .eq("indicador_id", currentIndicadorId);

      if (deactivateError) throw new Error(deactivateError.message);
    }

    for (let i = 0; i < grupo.valores.length; i++) {
      const valor = grupo.valores[i];

      if (valor.persisted) {
        const { error: campoError } = await supabase
          .from("obs_campos")
          .update({ nombre: valor.nombre.trim() })
          .eq("id", valor.id);

        if (campoError) throw new Error(campoError.message);

        if (valor.indicadorCampoId) {
          const { error: icError } = await supabase
            .from("obs_indicador_campos")
            .update({ orden: String(i + 1), activo: true })
            .eq("id", valor.indicadorCampoId);

          if (icError) throw new Error(icError.message);
        }
      } else if (valor.campoId) {
        const { error: icError } = await supabase
          .from("obs_indicador_campos")
          .insert({
            indicador_id: currentIndicadorId,
            campo_id: valor.campoId,
            orden: String(i + 1),
            activo: true,
          });

        if (icError) throw new Error(icError.message);
      } else {
        const { data: campo, error: campoError } = await supabase
          .from("obs_campos")
          .insert({
            nombre: valor.nombre.trim(),
            activo: true,
          })
          .select()
          .single();

        if (campoError) throw new Error(campoError.message);

        const { error: icError } = await supabase
          .from("obs_indicador_campos")
          .insert({
            indicador_id: currentIndicadorId,
            campo_id: campo.id,
            orden: String(i + 1),
            activo: true,
          });

        if (icError) throw new Error(icError.message);
      }
    }
  }
}

export async function createPoliticaConIndicadores(
  sectorId: string,
  codigo: string,
  descripcion: string,
  gruposIndicadores: FormIndicador[],
  politicaId?: string | null,
) {
  const input = parseInput(createPoliticaConIndicadoresInputSchema, {
    sectorId,
    codigo,
    descripcion,
    gruposIndicadores,
    politicaId,
  });

  const supabase = await createClient();
  let currentPoliticaId = input.politicaId ?? null;

  if (currentPoliticaId) {
    const { error: polError } = await supabase
      .from("obs_politicas")
      .update({
        sector_id: input.sectorId,
        codigo: input.codigo,
        descripcion: input.descripcion,
      })
      .eq("id", currentPoliticaId);

    if (polError) throw new Error(polError.message);
  } else {
    const { data: pol, error: polError } = await supabase
      .from("obs_politicas")
      .insert({
        sector_id: input.sectorId,
        codigo: input.codigo,
        descripcion: input.descripcion,
        activo: true,
      })
      .select()
      .single();

    if (polError) throw new Error(polError.message);
    currentPoliticaId = pol.id;
  }

  if (!currentPoliticaId) {
    throw new Error("No se pudo determinar la política.");
  }

  await persistPoliticaIndicadores(supabase, currentPoliticaId, input.gruposIndicadores);

  return { id: currentPoliticaId };
}

export async function createRegistro(
  organizacionId: string,
  mes: number,
  anio: number,
  registros: RegistroEntrada[],
) {
  const input = parseInput(createRegistroInputSchema, {
    organizacionId,
    mes,
    anio,
    registros,
  });

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  const { data: registro, error: regError } = await supabase
    .from("obs_registros")
    .insert({
      organizacion_id: input.organizacionId,
      mes: input.mes,
      anio: input.anio,
      created_by: userId,
    })
    .select()
    .single();

  if (regError) throw new Error(regError.message);

  const valoresToInsert = input.registros.flatMap((entry) =>
    Object.entries(entry.valores).map(([indicadorCampoId, cantidad]) => ({
      registro_id: registro.id,
      indicador_campo_id: indicadorCampoId,
      cantidad: parseInt(cantidad || "0", 10),
      nacionalidad_id:
        entry.nacionalidadId && entry.nacionalidadId !== "__none__"
          ? entry.nacionalidadId
          : null,
      perfil_id:
        entry.perfilId && entry.perfilId !== "__none__" ? entry.perfilId : null,
    })),
  );

  if (valoresToInsert.length > 0) {
    const { error: valError } = await supabase
      .from("obs_registros_valores")
      .insert(valoresToInsert);

    if (valError) throw new Error(valError.message);
  }

  return registro;
}

export async function createSector(nombre: string) {
  const input = parseInput(createSectorInputSchema, { nombre });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_sectores")
    .insert({ nombre: input.nombre })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ObsSector;
}

export async function getOrganizacionesLogos(): Promise<
  { id: string; nombre: string; logo: string | null }[]
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("obs_organizaciones")
    .select("id, nombre, logo")
    .order("nombre");
  if (error) throw new Error(error.message);

  return (data ?? []).map((org) => ({
    id: org.id,
    nombre: org.nombre,
    logo: org.logo ?? null,
  }));
}

export async function getAllOrganizaciones(): Promise<OrgWithSectors[]> {
  const supabase = await createClient();
  const { data: orgs, error: orgError } = await supabase
    .from("obs_organizaciones")
    .select("id, nombre, logo")
    .order("nombre");
  if (orgError) throw new Error(orgError.message);

  const { data: links, error: linkError } = await supabase
    .from("obs_organizaciones_sectores")
    .select("organizacion_id, sector_id, obs_sectores(id, nombre)");
  if (linkError) throw new Error(linkError.message);

  const sectorsByOrg = new Map<string, { id: string; nombre: string }[]>();
  for (const link of (links ?? []) as OrgSectorLinkWithSector[]) {
    const orgId = link.organizacion_id;
    const sector = unwrapRelation(link.obs_sectores);
    if (!sector) continue;
    if (!sectorsByOrg.has(orgId)) sectorsByOrg.set(orgId, []);
    sectorsByOrg.get(orgId)!.push(sector);
  }

  return (orgs ?? []).map((org) => ({
    id: org.id,
    nombre: org.nombre,
    logo: org.logo ?? null,
    sectores: sectorsByOrg.get(org.id) || [],
  }));
}

export async function updateOrganizacionLogo(organizacionId: string, logo: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("obs_organizaciones")
    .update({ logo })
    .eq("id", organizacionId);
  if (error) throw new Error(error.message);
}

export async function updateOrganizacionNombre(organizacionId: string, nombre: string) {
  const input = parseInput(updateOrganizacionNombreInputSchema, {
    organizacionId,
    nombre,
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_organizaciones")
    .update({ nombre: input.nombre })
    .eq("id", input.organizacionId)
    .select("id, nombre")
    .single();
  if (error) throw new Error(error.message);
  return data as ObsOrganizacion;
}

export async function createOrganizacion(nombre: string) {
  const input = parseInput(createOrganizacionInputSchema, { nombre });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_organizaciones")
    .insert({ nombre: input.nombre })
    .select("id, nombre")
    .single();
  if (error) throw new Error(error.message);
  return data as ObsOrganizacion;
}

export async function unlinkOrganizacionFromSector(organizacionId: string, sectorId: string) {
  const input = parseInput(orgSectorIdsInputSchema, { organizacionId, sectorId });
  const supabase = await createClient();
  const { error } = await supabase
    .from("obs_organizaciones_sectores")
    .delete()
    .eq("organizacion_id", input.organizacionId)
    .eq("sector_id", input.sectorId);
  if (error) throw new Error(error.message);
}

export async function linkOrganizacionToSector(organizacionId: string, sectorId: string) {
  const input = parseInput(orgSectorIdsInputSchema, { organizacionId, sectorId });
  const supabase = await createClient();
  const { error } = await supabase
    .from("obs_organizaciones_sectores")
    .insert({ organizacion_id: input.organizacionId, sector_id: input.sectorId });
  if (error) throw new Error(error.message);
}

export async function getNacionalidades() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_nacionalidades")
    .select("*")
    .order("nombre");
  if (error) throw new Error(error.message);
  return data as ObsNacionalidad[];
}

export async function getPerfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_perfiles")
    .select("*")
    .order("nombre");
  if (error) throw new Error(error.message);
  return data as ObsPerfil[];
}

export async function createNacionalidad(nombre: string) {
  const nombreParsed = parseInput(nombreInputSchema, nombre);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_nacionalidades")
    .insert({ nombre: nombreParsed })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ObsNacionalidad;
}

export async function createPerfil(nombre: string) {
  const nombreParsed = parseInput(nombreInputSchema, nombre);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_perfiles")
    .insert({ nombre: nombreParsed })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ObsPerfil;
}

export async function updateNacionalidad(id: string, nombre: string) {
  const nombreParsed = parseInput(nombreInputSchema, nombre);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_nacionalidades")
    .update({ nombre: nombreParsed })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ObsNacionalidad;
}

export async function updatePerfil(id: string, nombre: string) {
  const nombreParsed = parseInput(nombreInputSchema, nombre);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_perfiles")
    .update({ nombre: nombreParsed })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ObsPerfil;
}

export async function deleteNacionalidad(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("obs_nacionalidades").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePerfil(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("obs_perfiles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
