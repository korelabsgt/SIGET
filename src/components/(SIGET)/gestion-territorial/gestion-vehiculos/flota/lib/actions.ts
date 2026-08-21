"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { fotosVehiculo, MIN_FOTOS_VEHICULO, normalizeVehiculoRow } from "./helpers";
import { type VehiculoInput, vehiculoInputSchema, type VehiculoRow } from "./zod";

const TABLE = "ter_vehiculos";
const REVALIDATE_ROUTE = "/siget/gestion-territorial/gestion-vehiculos/flota";

async function requireAuth() {
  const supabase = await createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado.");
    return { supabase, user };
  } catch (err) {
    if (err instanceof Error && err.message === "No autenticado.") throw err;
    throw new Error("No se pudo verificar la sesión.");
  }
}

export async function getVehiculos(): Promise<VehiculoRow[]> {
  const { supabase } = await requireAuth();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => normalizeVehiculoRow(row as VehiculoRow));
}

export async function getVehiculo(id: string): Promise<VehiculoRow | null> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return normalizeVehiculoRow(data as VehiculoRow);
}

function payloadConFotos(data: VehiculoInput) {
  const imagenes = fotosVehiculo({
    imagen_url: data.imagen_url ?? null,
    imagenes: data.imagenes ?? [],
  });
  if (imagenes.length < MIN_FOTOS_VEHICULO) {
    throw new Error("Debes subir al menos una fotografía del vehículo.");
  }
  return { ...data, imagenes, imagen_url: imagenes[0] ?? null };
}

function mapImagenesDbError(message: string) {
  if (message.toLowerCase().includes("imagenes")) {
    return "No se pudieron guardar las fotografías. Falta la columna de galería en la flota.";
  }
  return message;
}

export async function createVehiculo(input: VehiculoInput): Promise<VehiculoRow> {
  const { supabase } = await requireAuth();

  const parsed = vehiculoInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Datos inválidos: " + parsed.error.message);
  }

  const payload = payloadConFotos(parsed.data);

  const { data: existingPlaca } = await supabase
    .from(TABLE)
    .select("id")
    .eq("placa", payload.placa)
    .maybeSingle();

  if (existingPlaca) {
    throw new Error(`La placa ${payload.placa} ya está registrada.`);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert([payload])
    .select("*")
    .single();

  if (error) throw new Error(mapImagenesDbError(error.message));

  revalidatePath(REVALIDATE_ROUTE);
  return normalizeVehiculoRow(data as VehiculoRow);
}

export async function updateVehiculo(id: string, input: VehiculoInput): Promise<VehiculoRow> {
  const { supabase } = await requireAuth();

  const parsed = vehiculoInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Datos inválidos: " + parsed.error.message);
  }

  const placa = parsed.data.placa.trim().toUpperCase();
  const payload = payloadConFotos({ ...parsed.data, placa });

  const { data: existingPlaca } = await supabase
    .from(TABLE)
    .select("id")
    .eq("placa", placa)
    .neq("id", id)
    .maybeSingle();

  if (existingPlaca) {
    throw new Error(`La placa ${parsed.data.placa} ya está registrada por otro vehículo.`);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(mapImagenesDbError(error.message));

  revalidatePath(REVALIDATE_ROUTE);
  return normalizeVehiculoRow(data as VehiculoRow);
}

function mapDeleteVehiculoError(message: string, code?: string): string {
  const m = message.toLowerCase();
  if (code === "23503" || m.includes("foreign key")) {
    if (m.includes("ter_bitacoras")) {
      return "No se puede eliminar el vehículo porque tiene bitácoras de viaje registradas.";
    }
    if (m.includes("ter_solicitudes")) {
      return "No se puede eliminar el vehículo porque está asignado a una o más solicitudes.";
    }
    if (m.includes("ter_fallas_mantenimiento") || m.includes("fallas")) {
      return "No se puede eliminar el vehículo porque tiene registros de mantenimiento asociados.";
    }
    return "No se puede eliminar el vehículo porque tiene registros relacionados en el sistema.";
  }
  return message;
}

async function contarDependenciasVehiculo(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const [bitacoras, solicitudes, fallas] = await Promise.all([
    supabase
      .from("ter_bitacoras")
      .select("id", { count: "exact", head: true })
      .eq("vehiculo_id", id),
    supabase
      .from("ter_solicitudes")
      .select("id", { count: "exact", head: true })
      .eq("vehiculo_id", id),
    supabase
      .from("ter_fallas_mantenimiento")
      .select("id", { count: "exact", head: true })
      .eq("vehiculo_id", id),
  ]);

  const bloqueos: string[] = [];
  if ((bitacoras.count ?? 0) > 0) {
    bloqueos.push(`${bitacoras.count} bitácora(s) de viaje`);
  }
  if ((solicitudes.count ?? 0) > 0) {
    bloqueos.push(`${solicitudes.count} solicitud(es)`);
  }
  if ((fallas.count ?? 0) > 0) {
    bloqueos.push(`${fallas.count} registro(s) de mantenimiento`);
  }

  return bloqueos;
}

export async function deleteVehiculo(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { supabase } = await requireAuth();

    const bloqueos = await contarDependenciasVehiculo(supabase, id);
    if (bloqueos.length > 0) {
      return {
        success: false,
        error: `No se puede eliminar el vehículo porque tiene ${bloqueos.join(", ")} asociados. Elimine o reasigne esos registros primero.`,
      };
    }

    const { error } = await supabase.from(TABLE).delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: mapDeleteVehiculoError(error.message, error.code),
      };
    }

    revalidatePath(REVALIDATE_ROUTE);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al eliminar el vehículo.",
    };
  }
}
