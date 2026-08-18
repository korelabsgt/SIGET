"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { type BitacoraInput, bitacoraInputSchema, type BitacoraRow } from "./zod";

const TABLE = "ter_bitacoras";
const REVALIDATE_ROUTE = "/siget/gestion-territorial/gestion-vehiculos/bitacoras";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function getBitacoras(): Promise<BitacoraRow[]> {
  try {
    const { supabase } = await requireAuth();
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        ter_vehiculos (placa, marca, modelo),
        profiles:conductor_id (full_name)
      `)
      .order("fecha", { ascending: false });

    if (error) throw error;
    return data as any;
  } catch (error) {
    console.error("Error fetching bitacoras:", error);
    return [];
  }
}

export async function createBitacora(input: BitacoraInput) {
  try {
    const { supabase } = await requireAuth();
    const parsed = bitacoraInputSchema.parse(input);

    const { error } = await supabase.from(TABLE).insert({
      ...parsed,
      fecha: new Date().toISOString(), // Use current timestamp
    });

    if (error) throw error;

    // If it's linked to a mission, finish it
    if (parsed.solicitud_id) {
      const { error: updateError } = await supabase
        .from("ter_solicitudes")
        .update({ estado: "FINALIZADA" })
        .eq("id", parsed.solicitud_id);
      
      if (updateError) throw updateError;
      revalidatePath("/siget/gestion-territorial/gestion-vehiculos/solicitudes");
    }

    revalidatePath(REVALIDATE_ROUTE);
    revalidatePath("/siget/gestion-territorial/gestion-vehiculos/flota");
    return { success: true };
  } catch (error) {
    console.error("Error creating bitacora:", error);
    return { success: false, error: "Error al crear la bitácora" };
  }
}

export async function getMetricasBitacoras() {
  try {
    const { supabase } = await requireAuth();
    
    // Simplest approach: fetch this month's data and reduce
    // Alternatively, could use an RPC, but we'll do it in JS for simplicity since volume is manageable
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
      .from(TABLE)
      .select("km_recorrido, monto_combustible")
      .gte("fecha", startOfMonth);

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
      .select("id, full_name")
      .order("full_name");
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching conductores:", error);
    return [];
  }
}

export async function getSolicitudesEnMision() {
  try {
    const { supabase } = await requireAuth();
    const { data, error } = await supabase
      .from("ter_solicitudes")
      .select(`
        id, 
        destino, 
        conductor_id, 
        vehiculo_id,
        ter_vehiculos (kilometraje_actual)
      `)
      .eq("estado", "EN_MISION");
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching solicitudes activas:", error);
    return [];
  }
}
