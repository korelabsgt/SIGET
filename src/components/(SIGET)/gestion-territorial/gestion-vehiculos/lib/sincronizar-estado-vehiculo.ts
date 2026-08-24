import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseServer = SupabaseClient;

const VEHICULOS_TABLE = "ter_vehiculos";
const FALLAS_TABLE = "ter_fallas_mantenimiento";
const SOLICITUDES_TABLE = "ter_solicitudes";

const FALLAS_ACTIVAS = ["PENDIENTE", "EN_REPARACION"] as const;
const SOLICITUDES_RESERVAN = ["APROBADA", "EN_MISION"] as const;

export async function sincronizarEstadoFlotaVehiculo(
  supabase: SupabaseServer,
  vehiculoId: string,
): Promise<void> {
  const { count: fallasActivas, error: fallasError } = await supabase
    .from(FALLAS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("vehiculo_id", vehiculoId)
    .in("estado", [...FALLAS_ACTIVAS]);

  if (fallasError) {
    throw new Error("No se pudieron verificar las averías del vehículo.");
  }

  if ((fallasActivas ?? 0) > 0) {
    const { error } = await supabase
      .from(VEHICULOS_TABLE)
      .update({ estado: "EN_MANTENIMIENTO" })
      .eq("id", vehiculoId);

    if (error) {
      throw new Error("No se pudo actualizar el estado del vehículo en flota.");
    }
    return;
  }

  const { count: reservasActivas, error: reservasError } = await supabase
    .from(SOLICITUDES_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("vehiculo_id", vehiculoId)
    .in("estado", [...SOLICITUDES_RESERVAN]);

  if (reservasError) {
    throw new Error("No se pudieron verificar las misiones del vehículo.");
  }

  const estado = (reservasActivas ?? 0) > 0 ? "RESERVADO" : "LIBRE";
  const { error } = await supabase
    .from(VEHICULOS_TABLE)
    .update({ estado })
    .eq("id", vehiculoId);

  if (error) {
    throw new Error("No se pudo actualizar el estado del vehículo en flota.");
  }
}
