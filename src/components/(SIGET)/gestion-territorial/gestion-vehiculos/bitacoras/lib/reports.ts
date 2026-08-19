"use server";

import { createClient } from "@/utils/supabase/server";

export async function getDatosReporteBitacora(mes: number, anio: number, vehiculo_id: string) {
  try {
    const supabase = await createClient();
    
    // Construct date range for the specified month and year
    // Mes is 1-indexed (1 = January, 12 = December)
    const startDate = new Date(anio, mes - 1, 1).toISOString();
    const endDate = new Date(anio, mes, 0, 23, 59, 59, 999).toISOString();

    let query = supabase
      .from("ter_bitacoras")
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
        profiles:conductor_id (full_name)
      `)
      .gte("fecha", startDate)
      .lte("fecha", endDate)
      .order("fecha", { ascending: true });

    if (vehiculo_id && vehiculo_id !== "all") {
      query = query.eq("vehiculo_id", vehiculo_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error fetching report data:", error);
    return [];
  }
}
