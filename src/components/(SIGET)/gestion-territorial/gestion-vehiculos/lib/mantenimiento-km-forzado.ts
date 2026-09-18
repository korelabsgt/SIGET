import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildDescripcionFallaServicioKm,
  getUmbralesMantenimientoForzadoAlcanzados,
} from "../flota/lib/helpers";
import { sincronizarEstadoFlotaVehiculo } from "./sincronizar-estado-vehiculo";

const FALLAS_TABLE = "ot_fallas_mantenimiento";
const FALLAS_ACTIVAS = ["PENDIENTE", "EN_REPARACION"] as const;

const VEHICULOS_TABLE = "ot_vehiculos";

export async function aplicarMantenimientoForzadoPorKm(
  supabase: SupabaseClient,
  params: { vehiculoId: string; kmActual: number; reportadoPor: string },
): Promise<{ aplicado: boolean; umbral: number | null }> {
  const { data: vehiculo, error: vehiculoError } = await supabase
    .from(VEHICULOS_TABLE)
    .select("kilometraje_actual, km_referencia_servicio")
    .eq("id", params.vehiculoId)
    .maybeSingle();

  if (vehiculoError) {
    console.error("Error leyendo referencia de servicio:", vehiculoError);
    return { aplicado: false, umbral: null };
  }

  const kmActual = params.kmActual;
  const kmReferencia =
    vehiculo?.km_referencia_servicio ?? vehiculo?.kilometraje_actual ?? kmActual;

  const umbrales = getUmbralesMantenimientoForzadoAlcanzados(kmActual, kmReferencia);
  if (umbrales.length === 0) {
    return { aplicado: false, umbral: null };
  }

  const { count: activas, error: activasError } = await supabase
    .from(FALLAS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("vehiculo_id", params.vehiculoId)
    .in("estado", [...FALLAS_ACTIVAS]);

  if (activasError) {
    console.error("Error verificando averías activas:", activasError);
    return { aplicado: false, umbral: null };
  }

  if ((activas ?? 0) > 0) {
    await sincronizarEstadoFlotaVehiculo(supabase, params.vehiculoId);
    return { aplicado: false, umbral: null };
  }

  for (const umbral of umbrales) {
    const prefix = `[SERVICIO-KM:${umbral}]`;
    const { count: existente, error: existenteError } = await supabase
      .from(FALLAS_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("vehiculo_id", params.vehiculoId)
      .ilike("descripcion", `${prefix}%`);

    if (existenteError) {
      console.error("Error verificando falla de servicio km:", existenteError);
      continue;
    }

    if ((existente ?? 0) > 0) continue;

    const { error: insertError } = await supabase.from(FALLAS_TABLE).insert({
      vehiculo_id: params.vehiculoId,
      severidad: "MEDIA",
      descripcion: buildDescripcionFallaServicioKm(umbral),
      evidencia_url: [],
      reportado_por: params.reportadoPor,
      estado: "PENDIENTE",
    });

    if (insertError) {
      console.error("Error creando falla de servicio km:", insertError);
      return { aplicado: false, umbral: null };
    }

    await sincronizarEstadoFlotaVehiculo(supabase, params.vehiculoId);
    return { aplicado: true, umbral };
  }

  await sincronizarEstadoFlotaVehiculo(supabase, params.vehiculoId);
  return { aplicado: false, umbral: null };
}
