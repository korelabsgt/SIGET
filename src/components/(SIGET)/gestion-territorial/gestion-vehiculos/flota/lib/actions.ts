"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { fotosVehiculo, imagenUrlParaDb, MIN_FOTOS_VEHICULO, normalizeVehiculoRow } from "./helpers";
import { type VehiculoInput, vehiculoInputSchema, type VehiculoRow } from "./zod";
import {
  normalizeVehiculoStoragePath,
  VEHICULOS_STORAGE_BUCKET,
} from "../../lib/storage";
import { canManageFlota } from "../../lib/permissions";
import { GV_BASE_ROUTE } from "../../lib/routes";

const TABLE = "ter_vehiculos";
const REVALIDATE_ROUTE = GV_BASE_ROUTE;

async function requireAuth() {
  const supabase = await createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado.");
    const role =
      (user.user_metadata?.rol as string | undefined) || user.role || "user";
    return { supabase, user, role };
  } catch (err) {
    if (err instanceof Error && err.message === "No autenticado.") throw err;
    throw new Error("No se pudo verificar la sesión.");
  }
}

async function requireFlotaManageAuth() {
  const auth = await requireAuth();
  if (!canManageFlota(auth.role)) {
    throw new Error("No tienes permisos para gestionar la flota vehicular.");
  }
  return auth;
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
  const fotos = fotosVehiculo({ imagen_url: data.imagen_url ?? [] });
  if (fotos.length < MIN_FOTOS_VEHICULO) {
    throw new Error("Debes subir al menos una fotografía del vehículo.");
  }
  return { ...data, imagen_url: imagenUrlParaDb(fotos) };
}

function mapImagenesDbError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("imagen_url")) {
    return `No se pudieron guardar las fotografías en imagen_url. (${message})`;
  }
  return message;
}

export async function createVehiculo(input: VehiculoInput): Promise<VehiculoRow> {
  const { supabase } = await requireFlotaManageAuth();

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
  const { supabase } = await requireFlotaManageAuth();

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

export async function removeVehiculoImagen(
  id: string,
  storagePath: string,
): Promise<VehiculoRow> {
  const { supabase } = await requireFlotaManageAuth();
  const path = normalizeVehiculoStoragePath(storagePath);
  if (!path) {
    throw new Error("No se pudo identificar la fotografía.");
  }

  const { data: row, error: loadError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (loadError || !row) {
    throw new Error("No se encontró el vehículo.");
  }

  const fotos = fotosVehiculo(row as VehiculoRow).filter(
    (foto) => normalizeVehiculoStoragePath(foto) !== path,
  );

  if (fotos.length < MIN_FOTOS_VEHICULO) {
    throw new Error("Debes conservar al menos una fotografía del vehículo.");
  }

  const fotosAnteriores = fotosVehiculo(row as VehiculoRow);

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      imagen_url: imagenUrlParaDb(fotos),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(mapImagenesDbError(error.message));

  const admin = createAdminClient();
  const { error: storageError } = await admin.storage
    .from(VEHICULOS_STORAGE_BUCKET)
    .remove([path]);

  if (storageError) {
    await supabase
      .from(TABLE)
      .update({ imagen_url: imagenUrlParaDb(fotosAnteriores) })
      .eq("id", id);
    throw new Error(`No se pudo eliminar la fotografía del almacenamiento. (${storageError.message})`);
  }

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
    const { supabase } = await requireFlotaManageAuth();

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
