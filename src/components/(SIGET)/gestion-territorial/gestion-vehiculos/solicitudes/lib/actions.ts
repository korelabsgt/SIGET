"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { type SolicitudInput, solicitudInputSchema, type SolicitudRow } from "./zod";

const TABLE = "ter_solicitudes";
const REVALIDATE_ROUTE = "/siget/gestion-territorial/gestion-vehiculos/solicitudes";

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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        solicitante:profiles!solicitante_id(id, nombre, email),
        aprobador:profiles!aprobado_por(id, nombre, email),
        vehiculo:ter_vehiculos!vehiculo_id(id, placa, marca, modelo, color, kilometraje_actual)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getSolicitudes:", error);
      return [];
    }

    return data as any[];
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
    if (role !== "super" && role !== "admin") {
      return { success: false, error: "No tienes permisos para realizar esta acción." };
    }

    const supabase = await createClient();
    const updateData: any = {
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
      console.error("Error DB cambiarEstadoSolicitud:", error);
      if (error.code === "23P01" || error.message?.includes("no_empalmes")) {
         return { success: false, error: "Error de empalme: El vehículo ya tiene una misión confirmada en esas fechas." };
      }
      return { success: false, error: error.message };
    }

    revalidatePath(REVALIDATE_ROUTE);
    return { success: true, data };
  } catch (err: any) {
    console.error("Error en cambiarEstadoSolicitud:", err);
    return { success: false, error: err.message || "Error desconocido" };
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
