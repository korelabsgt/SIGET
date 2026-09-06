"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { type BitacoraInput, bitacoraInputSchema, type BitacoraRow, toComentariosJsonbPayload } from "./zod";
import { normalizeBitacoraRow } from "./helpers";
import { loadMisionesVinculablesBitacora } from "./misiones-vinculables";
import { sincronizarEstadoFlotaVehiculo } from "../../lib/sincronizar-estado-vehiculo";
import { canExportBitacoraReporte, canViewAllBitacoras } from "../../lib/permissions";
import { GV_BASE_ROUTE } from "../../lib/routes";

const TABLE = "ter_bitacoras";
const REVALIDATE_ROUTE = GV_BASE_ROUTE;

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const role =
    (user.user_metadata?.rol as string | undefined) || user.role || "user";

  return { supabase, user, role };
}

export async function getBitacoras(): Promise<BitacoraRow[]> {
  try {
    const { supabase, user, role } = await requireAuth();

    let query = supabase
      .from(TABLE)
      .select(`
        *,
        ter_vehiculos (placa, marca, modelo),
        profiles:conductor_id (nombre)
      `)
      .order("fecha", { ascending: false });

    if (!canViewAllBitacoras(role)) {
      query = query.eq("conductor_id", user.id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data ?? []).map((row) => normalizeBitacoraRow(row as BitacoraRow));
  } catch (error) {
    console.error("Error fetching bitacoras:", error);
    return [];
  }
}

export async function createBitacora(input: BitacoraInput) {
  try {
    const { supabase, user } = await requireAuth();
    const parsed = bitacoraInputSchema.parse(input);
    const comentarios = toComentariosJsonbPayload(parsed.comentarios);
    const solicitudId = parsed.solicitud_id?.trim() || null;

    if (solicitudId) {
      const { data: solicitud, error: solicitudError } = await supabase
        .from("ter_solicitudes")
        .select("id, solicitante_id, estado")
        .eq("id", solicitudId)
        .maybeSingle();

      if (solicitudError || !solicitud) {
        return { success: false, error: "La misión vinculada no existe." };
      }
      if (solicitud.solicitante_id !== user.id) {
        return { success: false, error: "Solo puedes registrar la bitácora de tus misiones." };
      }

      if (solicitud.estado === "FINALIZADA") {
        const { data: bitacoraExistente, error: bitacoraExistenteError } = await supabase
          .from(TABLE)
          .select("id")
          .eq("solicitud_id", solicitudId)
          .maybeSingle();

        if (bitacoraExistenteError) {
          return { success: false, error: "No se pudo verificar la misión vinculada." };
        }
        if (bitacoraExistente) {
          return { success: false, error: "Esta misión ya tiene una bitácora vinculada." };
        }
      } else if (solicitud.estado !== "EN_MISION") {
        return { success: false, error: "La misión no puede vincularse en este estado." };
      }
    }

    const { error } = await supabase.from(TABLE).insert({
      solicitud_id: solicitudId,
      vehiculo_id: parsed.vehiculo_id,
      conductor_id: user.id,
      destino: parsed.destino,
      km_inicial: parsed.km_inicial,
      km_final: parsed.km_final,
      vale_combustible: parsed.vale_combustible || null,
      monto_combustible: parsed.monto_combustible,
      comentarios,
      fecha: new Date().toISOString(),
    });

    if (error) throw error;

    const { error: kmError } = await supabase
      .from("ter_vehiculos")
      .update({ kilometraje_actual: parsed.km_final })
      .eq("id", parsed.vehiculo_id);

    if (kmError) {
      console.error("Error updating vehiculo kilometraje:", kmError);
    }

    if (solicitudId) {
      const { data: solicitudActual, error: solicitudActualError } = await supabase
        .from("ter_solicitudes")
        .select("estado")
        .eq("id", solicitudId)
        .eq("solicitante_id", user.id)
        .maybeSingle();

      if (solicitudActualError || !solicitudActual) {
        console.error("Error reading solicitud estado:", solicitudActualError);
      } else if (solicitudActual.estado === "EN_MISION") {
        const { error: updateError } = await supabase
          .from("ter_solicitudes")
          .update({ estado: "FINALIZADA" })
          .eq("id", solicitudId)
          .eq("solicitante_id", user.id)
          .eq("estado", "EN_MISION");

        if (updateError) {
          console.error("Error finalizing solicitud:", updateError);
          return {
            success: false,
            error:
              "La bitácora se guardó, pero no se pudo finalizar la misión vinculada. Contacte al administrador.",
          };
        }
        revalidatePath(GV_BASE_ROUTE);
      }
    }

    await sincronizarEstadoFlotaVehiculo(supabase, parsed.vehiculo_id);

    revalidatePath(REVALIDATE_ROUTE);
    return { success: true };
  } catch (error) {
    console.error("Error creating bitacora:", error);
    return { success: false, error: "Error al crear la bitácora" };
  }
}

export async function getMetricasBitacoras() {
  try {
    const { supabase, user, role } = await requireAuth();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    let query = supabase
      .from(TABLE)
      .select("km_recorrido, monto_combustible")
      .gte("fecha", startOfMonth);

    if (!canViewAllBitacoras(role)) {
      query = query.eq("conductor_id", user.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total_km = data?.reduce((acc, curr) => acc + (curr.km_recorrido || 0), 0) || 0;
    const total_combustible = data?.reduce((acc, curr) => acc + (Number(curr.monto_combustible) || 0), 0) || 0;
    const total_misiones = data?.length || 0;

    return { total_km, total_combustible, total_misiones };
  } catch (error) {
    console.error("Error fetching metricas bitacoras:", error);
    return { total_km: 0, total_combustible: 0, total_misiones: 0 };
  }
}

export async function getConductores() {
  try {
    const { supabase } = await requireAuth();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nombre")
      .order("nombre");

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("Error fetching conductores:", error);
    return [];
  }
}

export async function getSolicitudesEnMision() {
  try {
    const { supabase, user } = await requireAuth();
    return await loadMisionesVinculablesBitacora(supabase, user.id);
  } catch (error) {
    console.error("Error fetching solicitudes activas:", error);
    return [];
  }
}

export async function getDatosReporteBitacora(mes: number, anio: number, vehiculo_id: string) {
  try {
    const { supabase, user, role } = await requireAuth();

    if (!canExportBitacoraReporte(role)) {
      return [];
    }

    const startDate = new Date(anio, mes - 1, 1, 0, 0, 0, 0).toISOString();
    const endDate = new Date(anio, mes, 0, 23, 59, 59, 999).toISOString();

    let query = supabase
      .from(TABLE)
      .select(`
        id,
        fecha,
        destino,
        km_inicial,
        km_final,
        km_recorrido,
        vale_combustible,
        monto_combustible,
        ter_vehiculos (placa, marca, modelo),
        profiles:conductor_id (nombre)
      `)
      .gte("fecha", startDate)
      .lte("fecha", endDate)
      .order("fecha", { ascending: true });

    if (vehiculo_id && vehiculo_id !== "all") {
      query = query.eq("vehiculo_id", vehiculo_id);
    }

    if (!canViewAllBitacoras(role)) {
      query = query.eq("conductor_id", user.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching report data:", error);
    return [];
  }
}
