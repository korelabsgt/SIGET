"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { sincronizarEstadoFlotaVehiculo } from "../../lib/sincronizar-estado-vehiculo";
import { canAprobarRechazarSolicitudes, canManageSolicitudesVehiculos, canViewAllSolicitudes, isSuperRole } from "../../lib/permissions";
import { GV_BASE_ROUTE } from "../../lib/routes";
import { type SolicitudInput, solicitudInputSchema, type SolicitudRow } from "./zod";

const TABLE = "ter_solicitudes";
const REVALIDATE_ROUTE = GV_BASE_ROUTE;
const FLOTA_ROUTE = GV_BASE_ROUTE;

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const role =
    (user.user_metadata?.rol as string | undefined) || user.role || "user";

  return { user, role, supabase };
}

export async function getSolicitudes(): Promise<SolicitudRow[]> {
  try {
    const { user, role, supabase } = await requireAuth();

    let query = supabase
      .from(TABLE)
      .select(`
        *,
        solicitante:profiles!solicitante_id(id, nombre, email),
        aprobador:profiles!aprobado_por(id, nombre, email),
        vehiculo:ter_vehiculos!vehiculo_id(id, placa, marca, modelo, color, kilometraje_actual, estado)
      `)
      .order("created_at", { ascending: false });

    if (!canViewAllSolicitudes(role)) {
      query = query.eq("solicitante_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error getSolicitudes:", error);
      return [];
    }

    return data as SolicitudRow[];
  } catch (error) {
    console.error("Excepción en getSolicitudes:", error);
    return [];
  }
}

export async function createSolicitud(input: SolicitudInput) {
  try {
    const { user } = await requireAuth();

    const parsed = solicitudInputSchema.parse(input);

    const { vehiculo_id, ...rest } = parsed;

    const supabase = await createClient();

    if (vehiculo_id) {
      const { data: vehiculo, error: vehiculoError } = await supabase
        .from("ter_vehiculos")
        .select("id, estado")
        .eq("id", vehiculo_id)
        .maybeSingle();

      if (vehiculoError) {
        return { success: false, error: "No se pudo verificar el vehículo seleccionado." };
      }
      if (!vehiculo) {
        return { success: false, error: "El vehículo seleccionado no existe." };
      }
      if (vehiculo.estado !== "LIBRE") {
        return {
          success: false,
          error: "El vehículo seleccionado ya no está disponible. Elija otro o deje sin preferencia.",
        };
      }
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert([
        {
          solicitante_id: user.id,
          vehiculo_id: vehiculo_id || null,
          fecha_inicio: rest.fecha_inicio,
          fecha_fin_estimada: rest.fecha_fin_estimada,
          destino: rest.destino,
          ruta_planificada: rest.ruta_planificada || null,
          justificacion: rest.justificacion,
          pasajeros: rest.pasajeros || null,
          estado: "PENDIENTE",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error DB createSolicitud:", error);
      if (error.code === "23P01" || error.message?.includes("no_empalmes")) {
         return { success: false, error: "El rango de fechas coincide con otra reserva confirmada para este vehículo." };
      }
      return { success: false, error: error.message };
    }

    revalidatePath(REVALIDATE_ROUTE);
    return { success: true, data };
  } catch (err: any) {
    console.error("Error en createSolicitud:", err);
    return { success: false, error: err.message || "Error desconocido" };
  }
}

export async function cambiarEstadoSolicitud(
  id: string,
  nuevoEstado: "PENDIENTE" | "APROBADA" | "EN_MISION" | "RECHAZADA" | "FINALIZADA",
  payload?: { vehiculo_id?: string }
) {
  try {
    const { user, role } = await requireAuth();
    const esAdmin = canAprobarRechazarSolicitudes(role);
    const esSuper = isSuperRole(role);
    const esTransicionMision = nuevoEstado === "EN_MISION" || nuevoEstado === "FINALIZADA";
    const esTransicionAprobacion =
      nuevoEstado === "APROBADA" || nuevoEstado === "RECHAZADA";

    if (esTransicionMision) {
      if (canManageSolicitudesVehiculos(role) && !esSuper) {
        return {
          success: false,
          error: "Solo el solicitante puede iniciar o finalizar la misión.",
        };
      }
    } else if (esTransicionAprobacion) {
      if (!esAdmin) {
        return { success: false, error: "No tienes permisos para realizar esta acción." };
      }
    } else {
      return { success: false, error: "Transición de estado no permitida." };
    }

    const supabase = await createClient();

    const { data: actual, error: actualError } = await supabase
      .from(TABLE)
      .select("id, solicitante_id, vehiculo_id, estado")
      .eq("id", id)
      .maybeSingle();

    if (actualError || !actual) {
      return { success: false, error: "No se encontró la solicitud." };
    }

    if (esTransicionMision) {
      if (!esSuper && actual.solicitante_id !== user.id) {
        return {
          success: false,
          error: "Solo el solicitante puede iniciar o finalizar esta misión.",
        };
      }

      if (nuevoEstado === "EN_MISION" && actual.estado !== "APROBADA") {
        return {
          success: false,
          error: "La misión solo puede iniciarse cuando la solicitud está aprobada.",
        };
      }

      if (nuevoEstado === "FINALIZADA" && actual.estado !== "EN_MISION") {
        return {
          success: false,
          error: "La misión solo puede finalizarse cuando está en curso.",
        };
      }
    }

    if (esTransicionAprobacion && actual.estado !== "PENDIENTE") {
      return {
        success: false,
        error: "Solo se pueden aprobar o rechazar solicitudes pendientes.",
      };
    }

    const vehiculoAsignado = payload?.vehiculo_id || actual.vehiculo_id;

    if (nuevoEstado === "APROBADA" || nuevoEstado === "EN_MISION") {
      if (!vehiculoAsignado) {
        return {
          success: false,
          error: "Debe asignar un vehículo para confirmar la misión.",
        };
      }

      const { data: vehiculo, error: vehiculoError } = await supabase
        .from("ter_vehiculos")
        .select("id, estado")
        .eq("id", vehiculoAsignado)
        .maybeSingle();

      if (vehiculoError || !vehiculo) {
        return { success: false, error: "No se pudo verificar el vehículo asignado." };
      }

      const yaAsignadoAEsta = actual.vehiculo_id === vehiculoAsignado;
      const disponible =
        vehiculo.estado === "LIBRE" ||
        (yaAsignadoAEsta && vehiculo.estado === "RESERVADO");

      if (!disponible) {
        return {
          success: false,
          error: "El vehículo ya no está disponible. Elija otro.",
        };
      }
    }

    const updateData: {
      estado: typeof nuevoEstado;
      aprobado_por?: string;
      vehiculo_id?: string;
    } = {
      estado: nuevoEstado,
    };

    if (nuevoEstado === "APROBADA" || nuevoEstado === "RECHAZADA") {
      updateData.aprobado_por = user.id;
    }

    if (payload?.vehiculo_id) {
      updateData.vehiculo_id = payload.vehiculo_id;
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23P01" || error.message?.includes("no_empalmes")) {
         return { success: false, error: "Error de empalme: El vehículo ya tiene una misión confirmada en esas fechas." };
      }
      return { success: false, error: "No se pudo actualizar el estado de la solicitud." };
    }

    const vehiculosAfectados = new Set<string>();
    if (actual.vehiculo_id) vehiculosAfectados.add(actual.vehiculo_id);
    if (data.vehiculo_id) vehiculosAfectados.add(data.vehiculo_id);

    for (const vehiculoId of vehiculosAfectados) {
      await sincronizarEstadoFlotaVehiculo(supabase, vehiculoId);
    }

    revalidatePath(REVALIDATE_ROUTE);
    revalidatePath(FLOTA_ROUTE);
    return { success: true, data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo actualizar el estado de la solicitud.";
    return { success: false, error: message };
  }
}

export async function searchProfiles(query: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nombre, email")
      .ilike("nombre", `%${query}%`)
      .limit(10);
      
    if (error) {
      console.error("Error searchProfiles:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Excepción en searchProfiles:", err);
    return [];
  }
}
