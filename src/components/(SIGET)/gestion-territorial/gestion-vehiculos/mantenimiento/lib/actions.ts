"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  type FallaMantenimientoFormData,
  FallaMantenimientoSchema,
  type AtenderFallaFormData,
  AtenderFallaSchema,
  type SolventarFallaFormData,
  SolventarFallaSchema,
  type FallaRow,
  type VehiculoFallaOption,
  type MecanicoOption,
} from "./zod";
import { sincronizarEstadoFlotaVehiculo } from "../../lib/sincronizar-estado-vehiculo";
import {
  canGestionarFallasMantenimiento,
  canViewAllFallasMantenimiento,
} from "../../lib/permissions";
import { vehiculoDisponibleParaReporteFalla, evidenciasFalla, normalizeFallaRow } from "./helpers";

const TABLE = "ter_fallas_mantenimiento";
const REVALIDATE_ROUTE = "/siget/gestion-territorial/gestion-vehiculos/mantenimiento";
const VEHICULOS_ROUTE = "/siget/gestion-territorial/gestion-vehiculos/flota";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const role =
    (user.user_metadata?.rol as string | undefined) || user.role || "user";

  return { supabase, user, role };
}

export async function getFallasMantenimiento(): Promise<FallaRow[]> {
  const { supabase, user, role } = await requireAuth();

  let query = supabase
    .from(TABLE)
    .select(`
      *,
      vehiculo:ter_vehiculos(placa, marca, modelo),
      reportador:profiles!ter_fallas_mantenimiento_reportado_por_fkey(nombre),
      mecanico:profiles!ter_fallas_mantenimiento_mecanico_id_fkey(nombre)
    `)
    .order("created_at", { ascending: false });

  if (!canViewAllFallasMantenimiento(role)) {
    query = query.eq("reportado_por", user.id);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => normalizeFallaRow(row as FallaRow));
}

export async function getVehiculosParaFallas(): Promise<VehiculoFallaOption[]> {
  const { supabase } = await requireAuth();
  
  const { data, error } = await supabase
    .from("ter_vehiculos")
    .select("id, placa, marca, modelo, estado")
    .neq("estado", "EN_MANTENIMIENTO")
    .order("placa", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as VehiculoFallaOption[];
}

export async function getMecanicos(): Promise<MecanicoOption[]> {
  const { supabase } = await requireAuth();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as MecanicoOption[];
}

export async function createFalla(input: FallaMantenimientoFormData): Promise<void> {
  try {
    const { supabase, user } = await requireAuth();

    const parsed = FallaMantenimientoSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("Los datos de la avería no son válidos.");
    }

    const { data: vehiculo, error: vehiculoError } = await supabase
      .from("ter_vehiculos")
      .select("estado")
      .eq("id", parsed.data.vehiculo_id)
      .maybeSingle();

    if (vehiculoError || !vehiculo) {
      throw new Error("Vehículo no encontrado.");
    }

    if (!vehiculoDisponibleParaReporteFalla(vehiculo.estado)) {
      throw new Error("Este vehículo ya está en mantenimiento.");
    }

    const { count: fallasActivas, error: fallasError } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("vehiculo_id", parsed.data.vehiculo_id)
      .in("estado", ["PENDIENTE", "EN_REPARACION"]);

    if (fallasError) {
      throw new Error("No se pudo verificar el estado del vehículo.");
    }

    if ((fallasActivas ?? 0) > 0) {
      throw new Error("Este vehículo ya tiene una avería activa.");
    }

    const { error } = await supabase.from(TABLE).insert([
      {
        ...parsed.data,
        evidencia_url: evidenciasFalla(parsed.data),
        reportado_por: user.id,
        estado: "PENDIENTE",
      },
    ]);

    if (error) {
      throw new Error("No se pudo registrar la avería.");
    }

    await sincronizarEstadoFlotaVehiculo(supabase, parsed.data.vehiculo_id);

    revalidatePath(REVALIDATE_ROUTE);
    revalidatePath(VEHICULOS_ROUTE);
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("No se pudo registrar la avería.");
  }
}

export async function atenderFalla(input: AtenderFallaFormData): Promise<void> {
  const { supabase, role } = await requireAuth();

  if (!canGestionarFallasMantenimiento(role)) {
    throw new Error("No tienes permisos para atender averías.");
  }

  const parsed = AtenderFallaSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Datos inválidos: " + parsed.error.message);
  }

  const payload: Record<string, string> = {
    estado: "EN_REPARACION",
  };

  if (parsed.data.mecanico_id) payload.mecanico_id = parsed.data.mecanico_id;
  if (parsed.data.taller_externo) payload.taller_externo = parsed.data.taller_externo;

  const { error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", parsed.data.falla_id);

  if (error) throw new Error(error.message);

  revalidatePath(REVALIDATE_ROUTE);
  revalidatePath(VEHICULOS_ROUTE);
}

export async function solventarFalla(input: SolventarFallaFormData): Promise<void> {
  try {
    const { supabase, role } = await requireAuth();

    if (!canGestionarFallasMantenimiento(role)) {
      throw new Error("No tienes permisos para solventar averías.");
    }

    const parsed = SolventarFallaSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("Los datos de la reparación no son válidos.");
    }

    const { data: falla, error: fetchError } = await supabase
      .from(TABLE)
      .select("id, vehiculo_id")
      .eq("id", parsed.data.falla_id)
      .maybeSingle();

    if (fetchError || !falla) {
      throw new Error("No se encontró la avería.");
    }

    const { error } = await supabase
      .from(TABLE)
      .update({
        estado: "SOLVENTADA",
        diagnostico: parsed.data.diagnostico,
        reparacion_detalle: parsed.data.reparacion_detalle,
        solventado_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.falla_id);

    if (error) {
      throw new Error("No se pudo marcar la avería como solventada.");
    }

    await sincronizarEstadoFlotaVehiculo(supabase, falla.vehiculo_id);

    revalidatePath(REVALIDATE_ROUTE);
    revalidatePath(VEHICULOS_ROUTE);
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("No se pudo marcar la avería como solventada.");
  }
}
