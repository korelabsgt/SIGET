"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  combinarFotosVehiculo,
  esFotoSeguroVehiculo,
  MAX_FOTOS_CIRCULACION,
  MAX_FOTOS_SEGURO,
  estadoVehiculoConReservaFija,
  fotosUnidadVehiculo,
  fotosVehiculo,
  imagenUrlParaDb,
  MIN_FOTOS_VEHICULO,
  listarVehiculosCatalogoFlota,
  normalizeVehiculoRow,
  separarFotosVehiculo,
} from "./helpers";
import { type VehiculoInput, vehiculoInputSchema, type VehiculoRow } from "./zod";
import type { ZodError } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeVehiculoStoragePath,
  VEHICULOS_STORAGE_BUCKET,
} from "../../lib/storage";

function mensajeErrorValidacionVehiculo(error: ZodError): string {
  const partes = error.issues
    .map((issue) => issue.message)
    .filter((msg) => msg.trim().length > 0);
  return partes.length > 0 ? partes.join(" ") : "Datos inválidos.";
}
import { canManageFlota, isSuperRole } from "../../lib/permissions";
import { GV_BASE_ROUTE } from "../../lib/routes";

const TABLE = "ot_vehiculos";
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

async function requireSuperFlotaAuth() {
  const auth = await requireFlotaManageAuth();
  if (!isSuperRole(auth.role)) {
    throw new Error("Solo super puede eliminar registros de la flota.");
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

  const rows = (data ?? []).map((row) => normalizeVehiculoRow(row as VehiculoRow));
  return listarVehiculosCatalogoFlota(rows);
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

function payloadConFotos(
  data: VehiculoInput,
  { requiereCirculacion = false }: { requiereCirculacion?: boolean } = {},
) {
  const fotos = fotosVehiculo({ imagen_url: data.imagen_url ?? [] });
  const { unidad, tarjetasCirculacion, fotoSeguro } = separarFotosVehiculo({
    imagen_url: fotos,
  });

  if (unidad.length < MIN_FOTOS_VEHICULO) {
    throw new Error("Debes subir al menos una fotografía del vehículo.");
  }
  if (tarjetasCirculacion.length > MAX_FOTOS_CIRCULACION) {
    throw new Error(`Puedes guardar hasta ${MAX_FOTOS_CIRCULACION} fotografías de circulación.`);
  }
  if (fotos.filter(esFotoSeguroVehiculo).length > MAX_FOTOS_SEGURO) {
    throw new Error("Solo puedes guardar una fotografía del seguro.");
  }
  if (requiereCirculacion && tarjetasCirculacion.length < 1) {
    throw new Error("Debes subir al menos una fotografía de la tarjeta de circulación.");
  }

  const estado = estadoVehiculoConReservaFija(data.placa, data.estado);
  const reservaUsuarioId =
    estado === "RESERVA_INDIVIDUAL" ? data.reserva_usuario_id ?? null : null;

  return {
    ...data,
    estado,
    reserva_usuario_id: reservaUsuarioId,
    imagen_url: imagenUrlParaDb(
      combinarFotosVehiculo(unidad, tarjetasCirculacion, fotoSeguro),
    ),
  };
}

function mapImagenesDbError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("imagen_url")) {
    return `No se pudieron guardar las fotografías en imagen_url. (${message})`;
  }
  return message;
}

function mapVehiculoDbError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("reserva_usuario_id") &&
    (lower.includes("column") ||
      lower.includes("schema cache") ||
      lower.includes("could not find"))
  ) {
    return "Falta la columna reserva_usuario_id en ot_vehiculos. Aplica en Supabase la migración db/migrations/ot_vehiculos_reserva_individual_usuario.sql.";
  }
  if (lower.includes("reserva_usuario") && lower.includes("foreign key")) {
    return "El usuario asignado no existe o no está activo.";
  }
  if (lower.includes("reserva_individual") && lower.includes("invalid input value for enum")) {
    return 'El estado "Reserva individual" no está habilitado en la base de datos. Aplica la migración ot_estado_vehiculo_reserva_individual.sql.';
  }
  return mapImagenesDbError(message);
}

type VehiculoPayloadDb = ReturnType<typeof payloadConFotos>;

function filaOtVehiculosDesdePayload(
  payload: VehiculoPayloadDb,
  modo: "insert" | "update",
) {
  const { reserva_usuario_id, ...resto } = payload;
  const fila: Record<string, unknown> = { ...resto };
  if (payload.estado === "RESERVA_INDIVIDUAL" && reserva_usuario_id) {
    fila.reserva_usuario_id = reserva_usuario_id;
  } else if (modo === "update") {
    fila.reserva_usuario_id = null;
  }
  return fila;
}

async function validarUsuarioReservaIndividual(
  supabase: SupabaseClient,
  usuarioId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", usuarioId)
    .eq("activo", true)
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error("El usuario asignado no existe o no está activo.");
  }
}

export async function createVehiculo(input: VehiculoInput): Promise<VehiculoRow> {
  const { supabase, user } = await requireFlotaManageAuth();

  const parsed = vehiculoInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(mensajeErrorValidacionVehiculo(parsed.error));
  }

  const payload = payloadConFotos(parsed.data, { requiereCirculacion: true });
  if (payload.estado === "RESERVA_INDIVIDUAL" && payload.reserva_usuario_id) {
    await validarUsuarioReservaIndividual(supabase, payload.reserva_usuario_id);
  }
  const fila = filaOtVehiculosDesdePayload(payload, "insert");

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
    .insert([
      {
        ...fila,
        km_referencia_servicio: payload.kilometraje_actual,
      },
    ])
    .select("*")
    .single();

  if (error) throw new Error(mapVehiculoDbError(error.message));

  const vehiculo = normalizeVehiculoRow(data as VehiculoRow);

  revalidatePath(REVALIDATE_ROUTE);
  return vehiculo;
}

export async function updateVehiculo(id: string, input: VehiculoInput): Promise<VehiculoRow> {
  const { supabase, user } = await requireFlotaManageAuth();

  const parsed = vehiculoInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(mensajeErrorValidacionVehiculo(parsed.error));
  }

  const placa = parsed.data.placa.trim().toUpperCase();
  const payload = payloadConFotos({ ...parsed.data, placa });
  if (payload.estado === "RESERVA_INDIVIDUAL" && payload.reserva_usuario_id) {
    await validarUsuarioReservaIndividual(supabase, payload.reserva_usuario_id);
  }
  const fila = filaOtVehiculosDesdePayload(payload, "update");

  const { data: existingPlaca } = await supabase
    .from(TABLE)
    .select("id")
    .eq("placa", placa)
    .neq("id", id)
    .maybeSingle();

  if (existingPlaca) {
    throw new Error(`La placa ${parsed.data.placa} ya está registrada por otro vehículo.`);
  }

  const { data: vehiculoActual, error: fetchActualError } = await supabase
    .from(TABLE)
    .select("kilometraje_actual")
    .eq("id", id)
    .maybeSingle();

  if (fetchActualError || !vehiculoActual) {
    throw new Error("No se encontró el vehículo a actualizar.");
  }

  const kmNuevo = payload.kilometraje_actual;
  const kmAnterior = vehiculoActual.kilometraje_actual ?? 0;
  const reiniciarCicloServicioKm = kmNuevo !== kmAnterior;

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      ...fila,
      ...(reiniciarCicloServicioKm ? { km_referencia_servicio: kmNuevo } : {}),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(mapVehiculoDbError(error.message));

  const vehiculo = normalizeVehiculoRow(data as VehiculoRow);

  revalidatePath(REVALIDATE_ROUTE);
  return vehiculo;
}

export async function removeVehiculoImagen(
  id: string,
  storagePath: string,
): Promise<VehiculoRow> {
  const { supabase } = await requireSuperFlotaAuth();
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

  if (fotosUnidadVehiculo({ imagen_url: fotos }).length < MIN_FOTOS_VEHICULO) {
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
    if (m.includes("ot_bitacoras")) {
      return "No se puede eliminar el vehículo porque tiene bitácoras de viaje registradas.";
    }
    if (m.includes("ot_solicitudes")) {
      return "No se puede eliminar el vehículo porque está asignado a una o más solicitudes.";
    }
    if (m.includes("ot_fallas_mantenimiento") || m.includes("fallas")) {
      return "No se puede eliminar el vehículo porque tiene registros de mantenimiento asociados.";
    }
    return "No se puede eliminar el vehículo porque tiene registros relacionados en el sistema.";
  }
  return message;
}

async function contarDependenciasVehiculo(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const [bitacoras, solicitudes, fallas] = await Promise.all([
    supabase
      .from("ot_bitacoras")
      .select("id", { count: "exact", head: true })
      .eq("vehiculo_id", id),
    supabase
      .from("ot_solicitudes")
      .select("id", { count: "exact", head: true })
      .eq("vehiculo_id", id),
    supabase
      .from("ot_fallas_mantenimiento")
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
    const { supabase } = await requireSuperFlotaAuth();

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
