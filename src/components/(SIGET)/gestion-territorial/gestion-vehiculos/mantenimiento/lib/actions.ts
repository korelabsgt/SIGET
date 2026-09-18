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
import { aplicarMantenimientoForzadoPorKm } from "../../lib/mantenimiento-km-forzado";
import { sincronizarEstadoFlotaVehiculo } from "../../lib/sincronizar-estado-vehiculo";
import {
  canGestionarFallasMantenimiento,
  canViewAllFallasMantenimiento,
} from "../../lib/permissions";
import { FALLAS_MANTENIMIENTO_SELECT } from "./fallas-query";
import { esFallaServicioKmProgramado, getKmReferenciaServicio } from "../../flota/lib/helpers";
import { vehiculoDisponibleParaReporteFalla, evidenciasFalla, normalizeFallaRow } from "./helpers";
import { roleFromAuthUser } from "../../lib/permissions";
import { GV_BASE_ROUTE } from "../../lib/routes";

const TABLE = "ot_fallas_mantenimiento";
const REVALIDATE_ROUTE = GV_BASE_ROUTE;
const VEHICULOS_ROUTE = GV_BASE_ROUTE;

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const role = roleFromAuthUser(user);

  return { supabase, user, role };
}

export async function getFallasMantenimiento(): Promise<FallaRow[]> {
  const { supabase, user, role } = await requireAuth();

  let query = supabase
    .from(TABLE)
    .select(FALLAS_MANTENIMIENTO_SELECT)
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
    .from("ot_vehiculos")
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

export async function vehiculoTieneAveriaActiva(vehiculoId: string): Promise<boolean> {
  try {
    const { supabase } = await requireAuth();
    const { count, error } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("vehiculo_id", vehiculoId)
      .in("estado", ["PENDIENTE", "EN_REPARACION"]);

    if (error) return false;
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function createFalla(input: FallaMantenimientoFormData): Promise<void> {
  try {
    const { supabase, user } = await requireAuth();

    const parsed = FallaMantenimientoSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("Los datos de la avería no son válidos.");
    }

    const { data: vehiculo, error: vehiculoError } = await supabase
      .from("ot_vehiculos")
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
    const { supabase, user, role } = await requireAuth();

    if (!canGestionarFallasMantenimiento(role)) {
      throw new Error("No tienes permisos para solventar averías.");
    }

    const parsed = SolventarFallaSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("Los datos de la reparación no son válidos.");
    }

    const { data: falla, error: fetchError } = await supabase
      .from(TABLE)
      .select("id, vehiculo_id, descripcion, vehiculo:ot_vehiculos(kilometraje_actual, km_referencia_servicio)")
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

    const vehiculoRel = falla.vehiculo as
      | { kilometraje_actual: number; km_referencia_servicio?: number | null }
      | { kilometraje_actual: number; km_referencia_servicio?: number | null }[]
      | null;
    const vehiculoRow = Array.isArray(vehiculoRel) ? vehiculoRel[0] : vehiculoRel;
    const kmActual = vehiculoRow?.kilometraje_actual;

    if (kmActual != null && esFallaServicioKmProgramado(falla.descripcion)) {
      const { error: refError } = await supabase
        .from("ot_vehiculos")
        .update({ km_referencia_servicio: kmActual })
        .eq("id", falla.vehiculo_id);

      if (refError) {
        throw new Error("No se pudo actualizar la referencia del último servicio.");
      }
    }

    await sincronizarEstadoFlotaVehiculo(supabase, falla.vehiculo_id);

    if (kmActual != null) {
      await aplicarMantenimientoForzadoPorKm(supabase, {
        vehiculoId: falla.vehiculo_id,
        kmActual,
        reportadoPor: user.id,
      });
    }

    revalidatePath(REVALIDATE_ROUTE);
    revalidatePath(VEHICULOS_ROUTE);
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("No se pudo marcar la avería como solventada.");
  }
}
